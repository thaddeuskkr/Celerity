import type { Command } from '../../types';
import { ActionRowBuilder, ApplicationCommandOptionType, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageComponentInteraction } from 'discord.js';
import { CelerityPlayer } from '../../util/player.js';
import { CelerityTrack } from '../../util/track.js';

export const command: Command = {
    name: 'search',
    description: 'Searches for music from one of multiple supported sources, and allows you to select a result.',
    aliases: ['find'],
    checks: ['vc', 'samevc', 'joinable', 'speakable', 'dj'],
    options: [
        {
            name: 'query',
            description: 'Your search query, supports URLs from multiple sources or a string.',
            type: ApplicationCommandOptionType.String,
            required: true,
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
                { name: 'Yandex Music', value: 'ym' },
            ],
        },
        {
            name: 'next',
            description: 'If the track should be added to the top of the queue. | `--next` / `-n`',
            type: ApplicationCommandOptionType.Boolean,
            required: false,
        },
        {
            name: 'playskip',
            description: 'If the track should be played immediately after result selection. | `--playskip` / `-ps`',
            type: ApplicationCommandOptionType.Boolean,
            required: false,
        },
        {
            name: 'shuffle',
            description: 'If the playlist should be shuffled before being added to the queue. | `--shuffle` / `-sh`',
            type: ApplicationCommandOptionType.Boolean,
            required: false,
        },
    ],

    async execute({ client, context, player, args, settings, prefix }) {
        if (!player) {
            try {
                const newPlayer = await client.shoukaku.joinVoiceChannel({
                    guildId: context.guild!.id,
                    channelId: context.member!.voice.channel!.id,
                    shardId: context.guild!.shardId,
                });
                if (settings.announceConnect)
                    client.respond(
                        context.channel,
                        `${client.config.emojis.connect} | **Joined <#${context.member!.voice.channel!.id}> and bound to <#${context.channel.id}>.**`,
                        'success',
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
        let playskip = false;
        let source: string | undefined;
        if (args.includes('--next') || args.includes('-n')) {
            if (args.indexOf('--next') !== -1) args.splice(args.indexOf('--next'), 1);
            if (args.indexOf('-n') !== -1) args.splice(args.indexOf('-n'), 1);
            next = true;
        }
        if (args.includes('--playskip') || args.includes('-ps')) {
            if (args.indexOf('--playskip') !== -1) args.splice(args.indexOf('--playskip'), 1);
            if (args.indexOf('-ps') !== -1) args.splice(args.indexOf('-ps'), 1);
            playskip = true;
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
                    'error',
                );
            args.splice(index, 2);
            source = `${source}search`;
        }
        const query = args.join(' ');
        const urls = extractURL(query);
        if (urls.length > 0) return client.commands.get('play')!.execute({ client, context, args, settings, player, prefix });
        const result = await player.node.rest.resolve(`${source || settings.searchProvider}:${query}`);
        if (!result || result.loadType !== 'search' || !result.data.length)
            return client.respond(context, `${client.config.emojis.error} | **No results found for \`${query}\`.**`, 'error');
        const uniqueIsrcs: Record<string, boolean> = {};
        const unique = result.data.filter((obj) => {
            if (!obj.info.isrc) return true;
            if (!uniqueIsrcs[obj.info.isrc]) {
                uniqueIsrcs[obj.info.isrc] = true;
                return true;
            }
            return false;
        });
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
                    new ButtonBuilder().setStyle(ButtonStyle.Primary).setCustomId('tracksearch-0').setEmoji('1️⃣').setDisabled(!result.data[0]),
                    new ButtonBuilder().setStyle(ButtonStyle.Primary).setCustomId('tracksearch-1').setEmoji('2️⃣').setDisabled(!result.data[1]),
                    new ButtonBuilder().setStyle(ButtonStyle.Primary).setCustomId('tracksearch-2').setEmoji('3️⃣').setDisabled(!result.data[2]),
                    new ButtonBuilder().setStyle(ButtonStyle.Primary).setCustomId('tracksearch-3').setEmoji('4️⃣').setDisabled(!result.data[3]),
                    new ButtonBuilder().setStyle(ButtonStyle.Primary).setCustomId('tracksearch-4').setEmoji('5️⃣').setDisabled(!result.data[4]),
                ),
                new ActionRowBuilder<ButtonBuilder>().addComponents(
                    new ButtonBuilder().setStyle(ButtonStyle.Primary).setCustomId('tracksearch-5').setEmoji('6️⃣').setDisabled(!result.data[5]),
                    new ButtonBuilder().setStyle(ButtonStyle.Primary).setCustomId('tracksearch-6').setEmoji('7️⃣').setDisabled(!result.data[6]),
                    new ButtonBuilder().setStyle(ButtonStyle.Primary).setCustomId('tracksearch-7').setEmoji('8️⃣').setDisabled(!result.data[7]),
                    new ButtonBuilder().setStyle(ButtonStyle.Primary).setCustomId('tracksearch-8').setEmoji('9️⃣').setDisabled(!result.data[8]),
                    new ButtonBuilder().setStyle(ButtonStyle.Danger).setCustomId('tracksearch-cancel').setEmoji('🗑️'),
                ),
            ],
            allowedMentions: { repliedUser: false },
        });
        const filter = (interaction: MessageComponentInteraction) => {
            interaction.deferUpdate();
            return (
                interaction.user.id === context.author.id && (/^tracksearch-\d+$/.test(interaction.customId) || interaction.customId === 'tracksearch-cancel')
            );
        };
        const collector = message.createMessageComponentCollector({ filter, time: 120000, max: 1 });
        collector.on('collect', async (i) => {
            if (i.customId === 'tracksearch-cancel') {
                message.edit({
                    embeds: [new EmbedBuilder().setColor('#F38BA8').setDescription(`${client.config.emojis.error} | **Search cancelled.**`)],
                    components: [],
                });
                return;
            }
            const selectedTrack = Number(i.customId.split('-')[1]);
            const track = unique[selectedTrack];
            if (!track) {
                message.edit({
                    embeds: [new EmbedBuilder().setColor('#F38BA8').setDescription(`${client.config.emojis.error} | **Invalid selection.**`)],
                    components: [],
                });
                return;
            }
            if (!player.current && playskip) playskip = false;
            if (playskip) {
                if (!settings.announceNowPlaying) {
                    message.edit({
                        embeds: [
                            new EmbedBuilder()
                                .setColor('#A6E3A1')
                                .setDescription(
                                    `${client.config.emojis.queued} | **Playing [${track.info.title} by ${track.info.author.replace(' - Topic', '')}](${
                                        track.info.uri
                                    })**`,
                                ),
                        ],
                        components: [],
                    });
                } else message.delete();
            } else {
                if (player.queue.length || player.current || !settings.announceNowPlaying)
                    message.edit({
                        embeds: [
                            new EmbedBuilder()
                                .setColor('#A6E3A1')
                                .setDescription(
                                    `${client.config.emojis.queued} | **Queued [${track.info.title} by ${track.info.author.replace(' - Topic', '')}](${
                                        track.info.uri
                                    }).**${next ? '\nInserted at the top of the queue.' : ''}`,
                                ),
                        ],
                        components: [],
                    });
                else message.delete();
            }
            player.handleTrack(new CelerityTrack(track, context.member!, source || settings.searchProvider), next, playskip);
        });
        collector.on('end', async (collected) => {
            if (!collected.size)
                message.edit({
                    embeds: [new EmbedBuilder().setColor('#F38BA8').setDescription(`${client.config.emojis.error} | **Search timed out.**`)],
                    components: [],
                });
        });
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
    },
};
