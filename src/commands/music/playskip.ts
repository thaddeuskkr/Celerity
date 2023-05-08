import type { Command } from '../../types';
import { ApplicationCommandOptionType } from 'discord.js';
import { CelerityTrack } from '../../util/track.js';

export const command: Command = {
    name: 'playskip',
    description: 'Queues music from one of multiple supported sources and immediately skips to it.',
    aliases: [ 'ps' ],
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
        }
    ],

    async execute({ client, context, player, args, settings, prefix }) {
        if (!player || !player.current) {
            const playCommand = client.commands.get('play')!;
            playCommand.execute({ client, context, args, settings, player, prefix });
            return;
        }
        let source;
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
                    client.respond(context.channel, `${ client.config.emojis.queued } | **Playing ${ tracks.length } tracks from __${ result.playlistInfo.name }__.**`, 'success');
                    player.handlePlaylist(tracks, false, true);
                    continue;
                }
                const track = result.tracks.shift()!;
                if (!settings.announceNowPlaying) client.respond(context.channel, `${ client.config.emojis.queued } | **Playing [${ track.info.title } by ${ track.info.author }](${ track.info.uri }).**`, 'success');
                player.handleTrack(new CelerityTrack(track, context.member!), false, true);
            }
            return;
        }
        const result = await client.node.rest.resolve(`${ source || settings.searchProvider }:${ query }`);
        if (!result || !result.tracks.length) return client.respond(context.channel, `${ client.config.emojis.error } | **No results found for \`${ query }\`.**`, 'error');
        const track = result.tracks.shift()!;
        if (!settings.announceNowPlaying) client.respond(context.channel, `${ client.config.emojis.queued } | **Playing [${ track.info.title } by ${ track.info.author }](${ track.info.uri }).**`, 'success');
        player.handleTrack(new CelerityTrack(track, context.member!), false, true);
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