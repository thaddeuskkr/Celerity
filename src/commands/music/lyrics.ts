import { ActionRowBuilder, ApplicationCommandOptionType, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageComponentInteraction } from 'discord.js';
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
        {
            name: 'search',
            description: 'Allows selection from a search result, rather than picking the first track.',
            type: ApplicationCommandOptionType.Boolean,
            required: false,
        },
    ],

    async execute({ client, context, args, player, settings }) {
        if (!args.length && (!player || !player.current))
            return client.respond(context, `${client.config.emojis.error} | **Invalid usage.**\nNothing is playing and you did not provide a query.`, 'error');
        let search = false;
        let identifier: string;
        let customQuery: string;
        let albumArt: string | undefined;
        let finalResult: Track | undefined;
        if (!args.length && player.current!.info.sourceName === 'spotify') {
            identifier = player.current!.info.identifier;
            albumArt = player.current!.info.artworkUrl;
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
        } else {
            if (args.includes('--search') || args.includes('-s')) {
                if (args.indexOf('--search') !== -1) args.splice(args.indexOf('--search'), 1);
                if (args.indexOf('-s') !== -1) args.splice(args.indexOf('-s'), 1);
                search = true;
            }
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
            } else {
                if (!result || result.loadType !== 'search' || !result.data.length)
                    return client.respond(
                        context,
                        `${client.config.emojis.error} | **No results for \`${query}\`.**${args.length ? '' : '\nTry using a custom search query instead.'}`,
                        'error',
                    );
                const uniqueIsrcs: Record<string, boolean> = {};
                const unique = result.data.filter((obj) => {
                    if (!obj.info.isrc) return true;
                    if (!uniqueIsrcs[obj.info.isrc]) {
                        uniqueIsrcs[obj.info.isrc] = true;
                        return true;
                    }
                    return false;
                });
                if (search) {
                    const message = await context.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setAuthor({ name: `Search results for ${query}`, iconURL: context.author.displayAvatarURL({ size: 4096 }) })
                                .setColor(settings.color)
                                .setFooter({ text: 'Select a track using the buttons below.' })
                                .setDescription(
                                    unique
                                        .slice(0, 9)
                                        .map((t, i) => `**${i + 1}.** [${t.info.title} by ${t.info.author.replace(' - Topic', '')}](${t.info.uri})`)
                                        .join('\n'),
                                ),
                        ],
                        components: [
                            new ActionRowBuilder<ButtonBuilder>().addComponents(
                                new ButtonBuilder().setStyle(ButtonStyle.Primary).setCustomId('lyricsearch-0').setEmoji('1️⃣').setDisabled(!result.data[0]),
                                new ButtonBuilder().setStyle(ButtonStyle.Primary).setCustomId('lyricsearch-1').setEmoji('2️⃣').setDisabled(!result.data[1]),
                                new ButtonBuilder().setStyle(ButtonStyle.Primary).setCustomId('lyricsearch-2').setEmoji('3️⃣').setDisabled(!result.data[2]),
                                new ButtonBuilder().setStyle(ButtonStyle.Primary).setCustomId('lyricsearch-3').setEmoji('4️⃣').setDisabled(!result.data[3]),
                                new ButtonBuilder().setStyle(ButtonStyle.Primary).setCustomId('lyricsearch-4').setEmoji('5️⃣').setDisabled(!result.data[4]),
                            ),
                            new ActionRowBuilder<ButtonBuilder>().addComponents(
                                new ButtonBuilder().setStyle(ButtonStyle.Primary).setCustomId('lyricsearch-5').setEmoji('6️⃣').setDisabled(!result.data[5]),
                                new ButtonBuilder().setStyle(ButtonStyle.Primary).setCustomId('lyricsearch-6').setEmoji('7️⃣').setDisabled(!result.data[6]),
                                new ButtonBuilder().setStyle(ButtonStyle.Primary).setCustomId('lyricsearch-7').setEmoji('8️⃣').setDisabled(!result.data[7]),
                                new ButtonBuilder().setStyle(ButtonStyle.Primary).setCustomId('lyricsearch-8').setEmoji('9️⃣').setDisabled(!result.data[8]),
                                new ButtonBuilder().setStyle(ButtonStyle.Danger).setCustomId('lyricsearch-cancel').setEmoji('🗑️'),
                            ),
                        ],
                        allowedMentions: { repliedUser: false },
                    });
                    const filter = (interaction: MessageComponentInteraction) => {
                        interaction.deferUpdate();
                        return (
                            interaction.user.id === context.author.id &&
                            (/^lyricsearch-\d+$/.test(interaction.customId) || interaction.customId === 'lyricsearch-cancel')
                        );
                    };
                    const collector = message.createMessageComponentCollector({ filter, time: 120000, max: 1 });
                    collector.on('collect', async (i) => {
                        if (i.customId === 'lyricsearch-cancel') {
                            await message.edit({
                                embeds: [new EmbedBuilder().setColor('#F38BA8').setDescription(`${client.config.emojis.error} | **Search cancelled.**`)],
                                components: [],
                            });
                            return;
                        }
                        const selectedTrack = Number(i.customId.split('-')[1]);
                        const track = unique[selectedTrack];
                        if (!track) {
                            await message.edit({
                                embeds: [new EmbedBuilder().setColor('#F38BA8').setDescription(`${client.config.emojis.error} | **Invalid selection.**`)],
                                components: [],
                            });
                            return;
                        }
                        finalResult = track;
                        albumArt = finalResult.info.artworkUrl;
                        identifier = finalResult.info.identifier;
                        const spotify = client.spotify;
                        axios
                            .get(`${lyrics_url}/${identifier}?format=json&market=from_token`, {
                                headers: {
                                    'User-Agent':
                                        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36',
                                    'App-platform': 'WebPlayer',
                                    authorization: `Bearer ${spotify.accessToken}`,
                                },
                                timeout: 3000,
                            })
                            .then(async (res) => {
                                const lyrics = res.data.lyrics;
                                const lyricsLines: string[] = [];
                                lyrics.lines.forEach((line: { words: string }) => lyricsLines.push(line.words));
                                const lyr = splitLyrics(lyricsLines.join('\n'));
                                const paginatedMessage = new CelerityPaginatedMessage(client, {
                                    template: new EmbedBuilder()
                                        .setColor(settings.color)
                                        .setFooter({ text: `Lyrics provided by ${lyrics.providerDisplayName}` }),
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
                                await message.delete();
                                return paginatedMessage.run(context);
                            })
                            .catch(async (err) => {
                                if (err.toJSON().status == 404) {
                                    client.logger.error('Lyrics fetching error (404): ' + String(err));
                                    await message
                                        .edit({
                                            embeds: [
                                                new EmbedBuilder()
                                                    .setColor('#F38BA8')
                                                    .setDescription(
                                                        `${client.config.emojis.error} | **Lyrics are unavailable for [${finalResult!.info.title} by ${finalResult!.info.author}](${finalResult!.info.uri}).**`,
                                                    ),
                                            ],
                                            components: [],
                                        })
                                        .catch(() => null);
                                    return;
                                }
                                client.logger.error('Lyrics fetching error: ' + String(err));
                                await message
                                    .edit({
                                        embeds: [
                                            new EmbedBuilder()
                                                .setColor('#F38BA8')
                                                .setDescription(
                                                    `${client.config.emojis.error} | **An unknown error occurred while fetching lyrics for [${finalResult!.info.title} by ${finalResult!.info.author}](${finalResult!.info.uri}).**`,
                                                ),
                                        ],
                                        components: [],
                                    })
                                    .catch(() => null);
                                return;
                            });
                    });
                    collector.on('end', async (collected) => {
                        if (!collected.size)
                            message
                                .edit({
                                    embeds: [new EmbedBuilder().setColor('#F38BA8').setDescription(`${client.config.emojis.error} | **Search timed out.**`)],
                                    components: [],
                                })
                                .catch(() => null);
                    });
                } else {
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
                }
            }
        }

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
