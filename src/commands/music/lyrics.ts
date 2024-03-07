import { ApplicationCommandOptionType, EmbedBuilder } from 'discord.js';
import type { Command } from '../../types';
import axios from 'axios';
import { CelerityPaginatedMessage } from '../../util/pagination.js';
import type { Track } from 'shoukaku';

const lyrics_url = 'https://spclient.wg.spotify.com/color-lyrics/v2/track';

export const command: Command = {
    name: 'lyrics',
    description: 'Shows lyrics for a query or the currently playing track.',
    aliases: ['ly'],
    checks: [],
    options: [
        {
            name: 'query',
            description: 'Your search query, supports Spotify URLs or a string.',
            type: ApplicationCommandOptionType.String,
            required: false,
        },
    ],

    async execute({ client, context, args, player, settings }) {
        if (!args.length && (!player || !player.current))
            return client.respond(context, `${client.config.emojis.error} | **Invalid usage.**\nNothing is playing and you did not provide a query.`, 'error');
        let identifier: string;
        let customQuery: string;
        let albumArt: string | undefined;
        let finalResult: Track | undefined;
        if (!args.length && player.current!.info.sourceName === 'spotify') {
            identifier = player.current!.info.identifier;
            albumArt = player.current!.info.artworkUrl;
        } else {
            const query = args.length
                ? args.join(' ')
                : `${player
                      .current!.info.title.replace('(Lyrics)', '')
                      .replace(`(${player.current!.info.title.replace(/\(.*?\)/g, '').trim()})`, '')} - ${player.current!.info.author.replace(' - Topic', '')}`;
            const spotifyURL = /^(https|http):\/\/(.*)\.spotify\.com\/track\//g.test(query);
            const node = client.shoukaku.nodes.get(client.config.lavalink.name);
            if (!node) return client.respond(context, `${client.config.emojis.error} | **No audio node available - cannot resolve lyrics.**`, 'error');
            let result;
            if (spotifyURL) result = await node.rest.resolve(`${query}`);
            else result = await node.rest.resolve(`spsearch:${query}`);
            if (result && result.loadType === 'track') {
                finalResult = result.data;
                identifier = finalResult.info.identifier;
                albumArt = finalResult.info.artworkUrl;
            } else {
                if (!result || result.loadType !== 'search' || !result.data.length)
                    return client.respond(
                        context,
                        `${client.config.emojis.error} | **No results for \`${query}\`.**${args.length ? '' : '\nTry using a custom search query instead.'}`,
                        'error',
                    );
                const tracks = result.data;
                for (let i = 0; i < tracks.length; i++) {
                    const track = tracks[i]!;
                    customQuery = `${track.info.title} - ${track.info.author}`;
                    if (
                        client.util.stringMatchPercentage(track.info.title, spotifyURL ? customQuery : query) < 75 &&
                        client.util.stringMatchPercentage(track.info.author, spotifyURL ? customQuery : query) < 50 &&
                        client.util.stringMatchPercentage(`${track.info.title} - ${track.info.author}`, spotifyURL ? customQuery : query) < 70 &&
                        client.util.stringMatchPercentage(`${track.info.author} - ${track.info.title}`, spotifyURL ? customQuery : query) < 70
                    )
                        continue;
                    else {
                        finalResult = track;
                        break;
                    }
                }
                if (!finalResult)
                    return client.respond(
                        context,
                        `${client.config.emojis.error} | **No results for \`${query}\`.**${args.length ? '' : '\nTry using a custom search query instead.'}`,
                        'error',
                    );
                identifier = finalResult.info.identifier;
                albumArt = finalResult.info.artworkUrl;
            }
        }
        const spotify = client.spotify;
        axios
            .get(`${lyrics_url}/${identifier}?format=json&market=from_token`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36',
                    'App-platform': 'WebPlayer',
                    authorization: `Bearer ${spotify.accessToken}`,
                },
                timeout: 3000,
            })
            .then((res) => {
                const lyrics = res.data.lyrics;
                const lyricsLines: string[] = [];
                lyrics.lines.forEach((line: { words: string }) => lyricsLines.push(line.words));
                const lyr = splitLyrics(lyricsLines.join('\n'));
                const paginatedMessage = new CelerityPaginatedMessage(client, {
                    template: new EmbedBuilder().setColor(settings.color).setFooter({ text: `Lyrics provided by ${lyrics.providerDisplayName}` }),
                });
                for (const page of lyr) {
                    const embed = new EmbedBuilder()
                        .setAuthor({ name: 'Lyrics' })
                        .setTitle(
                            args.length
                                ? `${finalResult!.info.title} - ${finalResult!.info.author}`
                                : `${player.current!.info.title} - ${player.current!.info.author}`,
                        )
                        .setURL(`https://open.spotify.com/track/${identifier}`)
                        .setThumbnail(albumArt ? albumArt : null)
                        .setDescription(page);
                    paginatedMessage.addPageEmbed(embed);
                }
                return paginatedMessage.run(context);
            })
            .catch((err) => {
                if (err.toJSON().status == 404) {
                    client.logger.error('Lyrics fetching error (404): ' + String(err));
                    client.respond(
                        context,
                        `${client.config.emojis.error} | **Lyrics are unavailable for [${finalResult!.info.title} by ${finalResult!.info.author}](${finalResult!.info.uri}).**`,
                        'error',
                    );
                    return;
                }
                client.logger.error('Lyrics fetching error: ' + String(err));
                client.respond(
                    context,
                    `${client.config.emojis.error} | **An unknown error occurred while fetching lyrics for [${finalResult!.info.title} by ${finalResult!.info.author}](${finalResult!.info.uri}).**`,
                    'error',
                );
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
                    page += `${lineArray[i]}\n`;
                    i++;
                    if (i >= lineArray.length) break;
                }
                if (page.trim().length > 0) pages.push(page);
            }
            return pages;
        }
    },
};
