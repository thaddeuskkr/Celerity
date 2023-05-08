import { ApplicationCommandOptionType, EmbedBuilder } from 'discord.js';
import type { Command } from '../../types';
import axios from 'axios';
import { PaginatedMessage } from '@sapphire/discord.js-utilities';

const lyrics_url = 'https://spclient.wg.spotify.com/color-lyrics/v2/track';

export const command: Command = {
    name: 'lyrics',
    description: 'Shows lyrics for a query or the currently playing track.',
    aliases: [ 'ly' ],
    checks: [],
    options: [
        {
            name: 'query',
            description: 'Your search query, supports Spotify URLs or a string.',
            type: ApplicationCommandOptionType.String,
            required: false
        }
    ],

    async execute({ client, context, args, player, settings }) {
        if (!args.length && (!player || !player.current)) return client.respond(context.channel, `${ client.config.emojis.error } | **Invalid usage.**\nNothing is playing and you did not provide a query.`, 'error');
        let identifier: string;
        let customQuery: string;
        if (!args.length && player.current!.info.sourceName === 'spotify') {
            identifier = player.current!.info.identifier;
        } else {
            const query = args.length ? args.join(' ') : `${ player.current!.info.title.replace('(Lyrics)', '').replace(`(${ player.current!.info.title.replace(/\(.*?\)/g, '').trim() })`, '') } - ${ player.current!.info.author.replace(' - Topic', '') }`;
            const spotifyURL = query.startsWith('https://open.spotify.com/track/');
            let result;
            let finalResult;
            if (spotifyURL) result = await client.node.rest.resolve(`${ query }`);
            else result = await client.node.rest.resolve(`spsearch:${ query }`);
            if (!result!.tracks.length) return client.respond(context.channel, `${ client.config.emojis.error } | **No results for \`${ query }\`.**${ args.length ? '' : '\nTry using a custom search query instead.' }`, 'error');
            const tracks = result!.tracks;
            for (let i = 0; i < tracks.length; i++) {
                const track = tracks[i]!;
                customQuery = `${ track.info.title } - ${ track.info.author }`;
                if (
                    client.util.stringMatchPercentage(track.info.title, spotifyURL ? customQuery : query) < 90 &&
                    client.util.stringMatchPercentage(track.info.author, spotifyURL ? customQuery : query) < 75 &&
                    client.util.stringMatchPercentage(`${ track.info.title } - ${ track.info.author }`, spotifyURL ? customQuery : query) < 75 &&
                    client.util.stringMatchPercentage(`${ track.info.author } - ${ track.info.title }`, spotifyURL ? customQuery : query) < 75
                ) continue;
                else {
                    finalResult = track;
                    break;
                }
            }
            if (!finalResult) return client.respond(context.channel, `${ client.config.emojis.error } | **No results for \`${ query }\`.**${ args.length ? '' : '\nTry using a custom search query instead.' }`, 'error');
            identifier = finalResult.info.identifier;
        }
        const spotify = client.spotify;
        axios.get(`${ lyrics_url }/${ identifier }?format=json&market=from_token`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36',
                'App-platform': 'WebPlayer',
                'authorization': `Bearer ${ spotify.accessToken }`
            },
            timeout: 3000
        }).then(res => {
            const lyrics = res.data.lyrics;
            const lyricsLines: string[] = [];
            lyrics.lines.forEach((line: { words: string }) => lyricsLines.push(line.words));
            const lyr = splitLyrics(lyricsLines.join('\n'));
            const paginatedMessage = new PaginatedMessage({
                template: new EmbedBuilder()
                    .setColor(settings.color)
                    .setFooter({ text: `Lyrics provided by ${ lyrics.providerDisplayName }` })
            });
            for (const page of lyr) {
                const embed = new EmbedBuilder()
                    .setAuthor({ name: 'Lyrics' })
                    .setTitle(customQuery || `${ player.current!.info.title } - ${ player.current!.info.author }`)
                    .setURL(`https://open.spotify.com/track/${ identifier }`)
                    .setDescription(page);
                paginatedMessage.addPageEmbed(embed);
            }
            return paginatedMessage.run(context);
        }).catch((err) => {
            if (err.toJSON().status == 404) {
                client.respond(context.channel, `${ client.config.emojis.error } | **Lyrics are unavailable for this track.**`, 'error');
                return;
            }
            client.logger.error('Lyrics fetching error: ' + String(err));
            client.respond(context.channel, `${ client.config.emojis.error } | **An unknown error occurred while fetching lyrics.**`, 'error');
            return;
        });
        return;

        function splitLyrics(lyrics: string) {
            const maxCharsInAPage = 1024;
            const lineArray = lyrics.split('\n');
            const pages = [];
            for (let i = 0; i < lineArray.length; i++) {
                let page = '';
                while (lineArray[i]!.length + page.length < maxCharsInAPage) {
                    page += `${ lineArray[i] }\n`;
                    i++;
                    if (i >= lineArray.length) break;
                }
                if (page.trim().length > 0) pages.push(page);
            }
            return pages;
        }
    }
};