import { ApplicationCommandOptionType } from 'discord.js';
import type { Track } from 'shoukaku';
import type { Command } from '../../types';
import { CelerityPlayer } from '../../util/player.js';
import { CelerityTrack } from '../../util/track.js';

export const command: Command = {
    name: 'play',
    description: 'Plays music from one of multiple supported sources.',
    aliases: ['p'],
    examples: [
        '{p}play capable of love',
        '{p}play https://open.spotify.com/playlist/56Jzp2GTWJftcjyAnfQ0F4',
        '{p}play fireflies --source sp',
        '{p}play never gonna give you up --next',
        '{p}play fireflies -s sp -n',
        '{p}play https://open.spotify.com/playlist/56Jzp2GTWJftcjyAnfQ0F4 --shuffle',
        '{p}play https://open.spotify.com/playlist/56Jzp2GTWJftcjyAnfQ0F4 -sh'
    ],
    checks: ['vc', 'samevc', 'joinable', 'speakable', 'dj'],
    options: [
        {
            name: 'query',
            description: 'Your search query, supports URLs from multiple sources or a string.',
            type: ApplicationCommandOptionType.String,
            required: true
        },
        {
            name: 'source',
            description: 'The search provider to use. Set the default using the `set` command. | `--source` / `-s`',
            type: ApplicationCommandOptionType.String,
            required: false,
            choices: [
                { name: 'YouTube', value: 'yt' },
                { name: 'YouTube Music', value: 'ytm' },
                { name: 'Deezer', value: 'dz' },
                { name: 'Spotify', value: 'sp' },
                { name: 'SoundCloud', value: 'sc' },
                { name: 'Apple Music', value: 'am' },
                { name: 'Yandex Music', value: 'ym' }
            ]
        },
        {
            name: 'next',
            description: 'If the track should be added to the top of the queue. | `--next` / `-n`',
            type: ApplicationCommandOptionType.Boolean,
            required: false
        },
        {
            name: 'shuffle',
            description: 'If the playlist should be shuffled before being added to the queue. | `--shuffle` / `-sh`',
            type: ApplicationCommandOptionType.Boolean,
            required: false
        }
    ],
    tips: [
        'Use `{p}set provider` to change the default search provider.',
        'The accepted providers are: YouTube, YouTube Music, Deezer, Spotify, SoundCloud, Apple Music, Yandex Music.',
        'The shorthand for the above are: `yt`, `ytm`, `dz`, `sp`, `sc`, `am`, `ym` (respectively - to be used in the `--source` option).'
    ],

    async execute({ client, context, player, args, settings }) {
        if (!player) {
            try {
                const newPlayer = await client.shoukaku.joinVoiceChannel({
                    guildId: context.guild!.id,
                    channelId: context.member!.voice.channel!.id,
                    shardId: context.guild!.shardId,
                    deaf: true
                });
                if (settings.announceConnect)
                    client.respond(
                        context.channel,
                        `${client.config.emojis.connect} | **Joined <#${context.member!.voice.channel!.id}> and bound to <#${context.channel.id}>.**`,
                        'success'
                    );
                player = new CelerityPlayer(client, context.member!, context.channel!, newPlayer);
                client.players.set(context.guild!.id, player);
                player.stopped = true;
                client.util.timeout(player);
            } catch (err) {
                client.respond(context.channel, `${client.config.emojis.error} | **Failed to connect to <#${context.member!.voice.channel!.id}>.**`, 'error');
                client.logger.error(`Failed to connect to voice channel ${context.member!.voice.channel!.id} in ${context.guild!.name} (${context.guild!.id})`);
                client.logger.error(err);
                return;
            }
        }
        let next = false;
        let shuffle = false;
        let source: string | undefined = undefined;
        if (args.includes('--next') || args.includes('-n')) {
            if (args.indexOf('--next') !== -1) args.splice(args.indexOf('--next'), 1);
            if (args.indexOf('-n') !== -1) args.splice(args.indexOf('-n'), 1);
            next = true;
        }
        if (args.includes('--shuffle') || args.includes('-sh')) {
            if (args.indexOf('--shuffle') !== -1) args.splice(args.indexOf('--shuffle'), 1);
            if (args.indexOf('-sh') !== -1) args.splice(args.indexOf('-sh'), 1);
            shuffle = true;
        }
        if (args.includes('--source') || args.includes('-s')) {
            let index = -1;
            if (args.indexOf('--source') !== -1) index = args.indexOf('--source');
            if (args.indexOf('-s') !== -1) index = args.indexOf('-s');
            source = args[index + 1]?.toLowerCase();
            if (!source)
                return client.respond(context, `${client.config.emojis.error} | **Invalid usage.**\nUsage: \`--source <source>\` or \`-s <source>\`.`, 'error');
            if (!['ytm', 'yt', 'sp', 'dz', 'sc', 'am', 'ym'].includes(source))
                return client.respond(
                    context,
                    `${client.config.emojis.error} | **Invalid source.**\nAccepts: \`ytm\`, \`yt\`, \`sp\`, \`dz\`, \`sc\`, \`am\`, \`ym\`.`,
                    'error'
                );
            args.splice(index, 2);
            source = `${source}search`;
        }
        const query = args.join(' ');
        const urls = extractURL(query);
        if (urls.length > 0) {
            for (let i = 0; i < urls.length; i++) {
                const result = await player.node.rest.resolve(urls[i]!);
                if (!result || result.loadType === 'empty' || result.loadType === 'error')
                    return client.respond(context, `${client.config.emojis.error} | **No results found for \`${urls[i]}\`.**`, 'error');
                if (result.loadType === 'track' && result.data.info.isStream)
                    return client.respond(context, `${client.config.emojis.error} | **Live / audio streams are not supported.**`, 'error');
                const playlist = result.loadType === 'playlist';
                if (playlist) {
                    const tracks = result.data.tracks
                        .filter((t) => !t.info.isStream)
                        .map((t) => new CelerityTrack(t, context.member!, isYouTubeMusicUrl(urls[i]!) ? 'ytmsearch' : undefined));
                    client.respond(
                        context,
                        `${client.config.emojis.queued} | **Queued ${tracks.length} tracks from __${result.data.info.name}__.**${
                            next ? '\nInserted at the top of the queue.' : ''
                        }`,
                        'success'
                    );
                    player.handlePlaylist(tracks, next, false, shuffle);
                    continue;
                }
                const track = result.data as Track;
                if (player.queue.length !== 0 || player.current || !settings.announceNowPlaying)
                    client.respond(
                        context,
                        `${client.config.emojis.queued} | **Queued [${track.info.title} by ${track.info.author.replace(' - Topic', '')}](${track.info.uri}).**${
                            next ? '\nInserted at the top of the queue.' : ''
                        }`,
                        'success'
                    );
                player.handleTrack(new CelerityTrack(track, context.member!, isYouTubeMusicUrl(urls[i]!) ? 'ytmsearch' : undefined), next);
            }
            return;
        }
        const result = await player.node.rest.resolve(`${source || settings.searchProvider}:${query}`);
        if (!result || result.loadType !== 'search' || !result.data.length)
            return client.respond(context, `${client.config.emojis.error} | **No results found for \`${query}\`.**`, 'error');
        const track = result.data.shift()!;
        if (player.queue.length || player.current || !settings.announceNowPlaying)
            client.respond(
                context,
                `${client.config.emojis.queued} | **Queued [${track.info.title} by ${track.info.author.replace(' - Topic', '')}](${track.info.uri}).**${
                    next ? '\nInserted at the top of the queue.' : ''
                }`,
                'success'
            );
        player.handleTrack(new CelerityTrack(track, context.member!, source || settings.searchProvider), next);
        return;

        function extractURL(str: string, lower = false) {
            const regexp = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\\+.~#?!&/=]*)/gi;
            if (str) {
                const urls = str.match(regexp);
                if (urls) {
                    return lower ? urls.map((item) => item.toLowerCase()) : urls;
                }
                return [];
            }
            return [];
        }

        function isYouTubeMusicUrl(url: string) {
            const youtubeMusicRegex = /^(https?:\/\/)?(www\.)?(music\.youtube\.com\/watch\?v=|music\.youtube\.com\/playlist\?list=)([a-zA-Z0-9_-]+)/;
            return youtubeMusicRegex.test(url);
        }
    }
};
