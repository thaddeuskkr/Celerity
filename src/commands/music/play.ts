import type { Command } from '../../types';
import { ApplicationCommandOptionType, ChannelType } from 'discord.js';
import { CelerityPlayer } from '../../util/player.js';
import { CelerityTrack } from '../../util/track.js';

export const command: Command = {
    name: 'play',
    description: 'Plays music from one of multiple supported sources.',
    aliases: [ 'p' ],
    checks: [ 'vc', 'samevc', 'joinable', 'speakable', 'dj' ],
    options: [
        {
            name: 'query',
            description: 'Your search query, supports URLs from multiple sources or a string.',
            type: ApplicationCommandOptionType.String,
            required: true
        },
        {
            name: 'source',
            description: 'The search provider to use. | `--source` / `-s`',
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
        }
    ],

    async execute({ client, context, player, args, settings }) {
        if (!player) {
            try {
                const newPlayer = await client.node.joinChannel({
                    guildId: context.guild!.id,
                    channelId: context.member!.voice.channel!.id,
                    shardId: context.guild!.shardId
                });
                if (settings.announceConnect) client.respond(context.channel, `${ client.config.emojis.connect } | **Joined <#${ context.member!.voice.channel!.id }> and bound to <#${ context.channel.id }>.**`, 'success');
                player = new CelerityPlayer(client, context.member!, context.channel!, newPlayer);
                client.players.set(context.guild!.id, player);
            } catch (err) {
                client.respond(context.channel, `${ client.config.emojis.error } | **Failed to connect to <#${ context.member!.voice.channel!.id }>.**`, 'error');
                client.logger.error(`Failed to connect to voice channel ${ context.member!.voice.channel!.id } in ${ context.guild!.name } (${ context.guild!.id })`);
                client.logger.error(err);
                return;
            }
            if (context.guild!.members.me!.voice.channel?.type === ChannelType.GuildStageVoice) client.util.removeSuppress(context.channel);
        }
        let next = false;
        let source;
        if (args.includes('--next') || args.includes('-n')) {
            if (args.indexOf('--next') !== -1) args.splice(args.indexOf('--next'), 1);
            if (args.indexOf('-n') !== -1) args.splice(args.indexOf('-n'), 1);
            next = true;
        }
        if (args.includes('--source') || args.includes('-s')) {
            let index = -1;
            if (args.indexOf('--source') !== -1) index = args.indexOf('--source');
            if (args.indexOf('-s') !== -1) index = args.indexOf('-s');
            source = args[index + 1];
            if (!source) return client.respond(context.channel, `${ client.config.emojis.error } | **Invalid usage.**\nUsage: \`--source <source>\` or \`-s <source>\`.`, 'error');
            if (![ 'ytm', 'yt', 'sp', 'dz', 'sc', 'am', 'ym' ].includes(source)) return client.respond(context.channel, `${ client.config.emojis.error } | **Invalid source.**\nAccepts: \`ytm\`, \`yt\`, \`sp\`, \`dz\`, \`sc\`, \`am\`, \`ym\`.`, 'error');
            args.splice(index, 2);
            source = `${ source }search`;
        }
        const query = args.join(' ');
        const urls = extractURL(query);
        if (urls.length > 0) {
            for (let i = 0; i < urls.length; i++) {
                const result = await client.node.rest.resolve(urls[i]!);
                if (!result || !result.tracks.length) return client.respond(context.channel, `${ client.config.emojis.error } | **No results found for \`${ urls[i] }\`.**`, 'error');
                if (result.tracks[0]?.info.isStream) return client.respond(context.channel, `${ client.config.emojis.error } | **Streams are currently unsupported, but will be in the future.**`, 'error');
                const playlist = result.loadType === 'PLAYLIST_LOADED';
                if (playlist) {
                    const tracks = result.tracks.map(t => new CelerityTrack(t, context.member!));
                    client.respond(context.channel, `${ client.config.emojis.queued } | **Queued ${ tracks.length } tracks from __${ result.playlistInfo.name }__.**${ next ? '\nInserted at the top of the queue.' : '' }`, 'success');
                    player.handlePlaylist(tracks, next);
                    continue;
                }
                const track = result.tracks.shift()!;
                if (player.queue.length !== 0 || player.current || !settings.announceNowPlaying) client.respond(context.channel, `${ client.config.emojis.queued } | **Queued [${ track.info.title } by ${ track.info.author }](${ track.info.uri }).**${ next ? '\nInserted at the top of the queue.' : '' }`, 'success');
                player.handleTrack(new CelerityTrack(track, context.member!), next);
            }
            return;
        }
        const result = await client.node.rest.resolve(`${ source || settings.searchProvider }:${ query }`);
        if (!result || !result.tracks.length) return client.respond(context.channel, `${ client.config.emojis.error } | **No results found for \`${ query }\`.**`, 'error');
        const track = result.tracks.shift()!;
        if (player.queue.length || player.current || !settings.announceNowPlaying) client.respond(context.channel, `${ client.config.emojis.queued } | **Queued [${ track.info.title } by ${ track.info.author }](${ track.info.uri }).**${ next ? '\nInserted at the top of the queue.' : '' }`, 'success');
        player.handleTrack(new CelerityTrack(track, context.member!), next);
        return;

        function extractURL(str: string, lower = false) {
            const regexp = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\\+.~#?!&/=]*)/gi;
            if (str) {
                const urls = str.match(regexp);
                if (urls) {
                    return lower ? urls.map((item) => item.toLowerCase()) : urls;
                } else {
                    return [];
                }
            } else {
                return [];
            }
        }
    }
};