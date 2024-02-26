import type { Event } from '../types';
import { Collection } from '@discordjs/collection';
import _ from 'lodash';
import equal from 'fast-deep-equal';
import { createRequire } from 'module';
import topgg from '@top-gg/sdk';

const require = createRequire(import.meta.url);

export const event: Event = {
    name: 'ready',
    once: true,
    emitter: 'client',

    async run(client) {
        if (!client.user) {
            client.logger.fatal('No client user!');
            process.exit();
        }

        const { username, id } = client.user;
        client.logger.info(`Logged in as ${username} (${id})`);

        // Get server settings from database for first startup
        const guildSettingsInit = await client.db.get('server-settings');
        client.statistics = (await client.db.get('statistics')) || client.config.baseStatistics;
        client.guildSettings = new Collection(guildSettingsInit);
        client.logger.info(`Retrieved ${client.guildSettings.size} server settings from database`);

        client.version = require('../../package.json').version;
        client.dependencies = require('../../package.json').dependencies;

        client.ready = true;
        client.logger.info('Ready to receive commands');

        // Write server settings and bot statistics to database every 10 seconds (if outdated)
        setInterval(async () => {
            // Server settings
            const guildSettings = client.guildSettings;
            if (!guildSettings || !guildSettings.size) return;
            else {
                const currentDatabase = await client.db.get('server-settings');
                if (equal([...new Collection(currentDatabase)], [...guildSettings])) return;
                else await client.db.set('server-settings', [...guildSettings]);
            }
            client.logger.debug('Updated per-server settings in database');
        }, 10000);
        setInterval(async () => {
            // Bot statistics
            if (equal(await client.db.get('statistics'), client.statistics)) return;
            else await client.db.set('statistics', client.statistics);
            client.logger.debug('Updated bot statistics in database');
        }, 10000);

        // Update client user presence
        setInterval(async () => {
            if (client.presenceUpdater.updateRequired) {
                const activity = _.cloneDeep(client.config.activities[client.presenceUpdater.currentIndex])!;
                let userCount = 0;
                client.guilds.cache.forEach((guild) => (userCount += guild.memberCount));
                activity.name = activity
                    .name!.replace('{version}', require('../../package.json').version)
                    .replace('{servercount}', String(client.guilds.cache.size))
                    .replace('{usercount}', String(userCount));
                if (client.user!.presence.activities[0]!.name !== activity.name)
                    client.user!.setPresence({
                        activities: [activity],
                        status: client.config.statuses[client.presenceUpdater.currentIndex],
                    });
                client.presenceUpdater.currentIndex =
                    client.presenceUpdater.currentIndex >= client.config.activities.length - 1 ? 0 : client.presenceUpdater.currentIndex + 1;
                client.presenceUpdater.updateRequired = false;
            }
        }, 1000);
        setInterval(() => (client.presenceUpdater.updateRequired = true), client.config.presenceUpdateInterval * 1000);

        // Check / update Spotify access token every 5 seconds
        setInterval(async () => {
            const spotify = client.spotify;
            if (!spotify || typeof spotify !== 'object' || Array.isArray(spotify) || spotify?.isAnonymous == true)
                return client.util.refreshSpotifyToken();
            const expiry = spotify.accessTokenExpirationTimestampMs;
            const now = Date.now();
            if (expiry < now) {
                await client.util.refreshSpotifyToken();
                return;
            }
        }, 5000);

        // Post stats to top.gg every 30 minutes
        if (client.config.topggToken.length)
            setInterval(async () => {
                const topggClient = new topgg.Api(client.config.topggToken);
                await topggClient.postStats({
                    serverCount: client.guilds.cache.size,
                    shardCount: client.shard?.count || 1,
                });
                client.logger.debug(`Posted stats to top.gg - ${client.guilds.cache.size} servers`);
            }, 1800000);
    },
};
