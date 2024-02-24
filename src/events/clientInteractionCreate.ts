import type { Event } from '../types';
import type { Interaction } from 'discord.js';
import _ from 'lodash';
import { ActionRowBuilder, ButtonStyle, EmbedBuilder, ButtonBuilder } from 'discord.js';
import { CelerityPaginatedMessage } from '../util/pagination.js';
import type { CelerityTrack } from '../util/track';

export const event: Event = {
    name: 'interactionCreate',
    once: false,
    emitter: 'client',

    async run(client, interaction: Interaction) {
        if (interaction.isButton() && interaction.guild && interaction.member) {
            const id = interaction.customId;
            const member = interaction.guild.members.cache.get(interaction.user.id)!;
            const me = interaction.guild.members.me!;
            if (
                id !== 'previous' &&
                id !== 'playback' &&
                id !== 'skip' &&
                id !== 'stop' &&
                id !== 'rewind' &&
                id !== 'shuffle' &&
                id !== 'loop' &&
                id !== 'queue' &&
                id !== 'autoplay' &&
                id !== 'disconnect'
            )
                return;
            const player = client.players.get(interaction.guild.id);
            const connection = client.shoukaku.connections.get(interaction.guild.id);
            const settings = client.guildSettings.get(interaction.guild.id) || _.cloneDeep(client.config.defaultSettings);
            const errorResponse = (text: string) => {
                interaction.reply({
                    embeds: [new EmbedBuilder().setDescription(`${client.config.emojis.error} | **${text}**`).setColor('#F38BA8')],
                    ephemeral: true,
                });
            };
            const successResponse = (text: string) => {
                interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setDescription(text)
                            .setFooter({
                                text: `Requested by ${interaction.user.username}`,
                                iconURL: interaction.user.displayAvatarURL({ size: 4096 }),
                            })
                            .setColor('#A6E3A1'),
                    ],
                });
            };
            if (!connection) return errorResponse("There isn't a voice connection in this server.");
            if (!player) return errorResponse("There isn't a player for this server.");
            if (id === 'disconnect') {
                if (member.voice.channelId === null) return errorResponse("You're not in a voice channel.");
                if (member.voice.channelId !== me.voice.channelId) return errorResponse(`You're not in <#${me.voice.channel?.id}>.`);
                successResponse(`${client.config.emojis.disconnect} | **Disconnected from <#${connection.channelId}>.**`);
                player.destroy();
                return;
            }
            if (!player.current || !me.voice.channel?.id) return errorResponse('There is nothing playing.');
            if (member.voice.channelId === null && id !== 'queue') return errorResponse("You're not in a voice channel.");
            if (member.voice.channelId !== me.voice.channelId && id !== 'queue') return errorResponse(`You're not in <#${me.voice.channel.id}>.`);
            switch (id) {
                case 'previous': {
                    if (!player.previous.length) return errorResponse('No previous tracks.');
                    if (player.loop === 'track') player.setLoop('off');
                    const prev = player.previous.shift();
                    player.previousUsed = true;
                    if (player.current!.info.requester.id === client.user!.id) player.autoplayQueue.unshift(player.current!);
                    else player.queue.unshift(player.current!);
                    if (prev!.info.requester.id === client.user!.id) player.autoplayQueue.unshift(prev!);
                    else player.queue.unshift(prev!);
                    await player.player.stopTrack();
                    if (!settings.announceNowPlaying)
                        successResponse(
                            `${client.config.emojis.previous} | **Returned to [${prev!.info.title} by ${prev!.info.author}](${prev!.info.uri}).**`,
                        );
                    else interaction.deferUpdate();
                    break;
                }
                case 'playback': {
                    const current = player.current!;
                    if (player.player.paused) {
                        await player.player.setPaused(false);
                        successResponse(
                            `${client.config.emojis.resume} | **Resumed [${current.info.title} by ${current.info.author}](${current.info.uri}).**`,
                        );
                    } else {
                        await player.player.setPaused(true);
                        successResponse(
                            `${client.config.emojis.pause} | **Paused [${current.info.title} by ${current.info.author}](${current.info.uri}).**`,
                        );
                    }
                    break;
                }
                case 'skip': {
                    if (player.loop === 'track') player.setLoop('off');
                    successResponse(
                        `${client.config.emojis.skip} | **Skipped [${player.current!.info.title} by ${player.current!.info.author}](${
                            player.current!.info.uri
                        }).**`,
                    );
                    await player.player.stopTrack();
                    break;
                }
                case 'stop': {
                    if (player.queue.length) player.queue.clear();
                    if (player.autoplayQueue.length) player.autoplayQueue.clear();
                    player.setLoop('off');
                    player.stopped = true;
                    await player.player.stopTrack();
                    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
                        new ButtonBuilder()
                            .setCustomId('disconnect')
                            .setLabel('Disconnect')
                            .setStyle(ButtonStyle.Danger)
                            .setEmoji(client.config.emojis.disconnect),
                    );
                    interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setDescription(`${client.config.emojis.stop} | **Stopped the player.**`)
                                .setFooter({
                                    text: `Requested by ${interaction.user.username}`,
                                    iconURL: interaction.user.displayAvatarURL({ size: 4096 }),
                                })
                                .setColor('#A6E3A1'),
                        ],
                        components: [row],
                    });
                    break;
                }
                case 'rewind': {
                    const track = player.current!;
                    await player.player.seekTo(0);
                    successResponse(`${client.config.emojis.rewind} | **Rewound [${track.info.title} by ${track.info.author}](${track.info.uri}).**`);
                    break;
                }
                case 'shuffle': {
                    if (!player.queue.length) return errorResponse('There are no tracks in the queue.');
                    player.queue.shuffle();
                    successResponse(`${client.config.emojis.shuffle} | **Shuffled ${player.queue.length} tracks.**`);
                    break;
                }
                case 'loop': {
                    if (player.loop === 'off') player.setLoop('track');
                    else if (player.loop === 'track') player.setLoop('queue');
                    else if (player.loop === 'queue') player.setLoop('off');
                    successResponse(
                        `${
                            player.loop === 'off'
                                ? client.config.emojis.loopOff
                                : player.loop === 'queue'
                                  ? client.config.emojis.loopQueue
                                  : client.config.emojis.loopTrack
                        } | **${player.loop === 'off' ? 'Loop disabled' : player.loop === 'queue' ? 'Queue loop enabled' : 'Track loop enabled'}.**`,
                    );
                    break;
                }
                case 'queue': {
                    if (!player.queue.length) return errorResponse('There are no tracks in the queue.');
                    const queue = player.queue;
                    const chunkedQueue = _.chunk(queue, 15);
                    let loopText = '';
                    if (player.loop === 'queue') loopText = '\n🔁 Looping the queue';
                    else if (player.loop === 'track') loopText = '\n🔂 Looping the current track';
                    const paginatedMessage = new CelerityPaginatedMessage(client, {
                        template: new EmbedBuilder().setColor(settings.color).setFooter({
                            text: `${queue.length} track(s) in queue • ${player.ms(queue.totalDuration)} • Requested by ${
                                interaction.user.username
                            }${loopText}`,
                        }),
                    });
                    for (let x = 0; x < chunkedQueue.length; x++) {
                        const descriptionLines = [];
                        for (let i = 0; i < chunkedQueue[x]!.length; i++) {
                            const track: CelerityTrack = chunkedQueue[x]![i]!;
                            descriptionLines.push(
                                `**${i + 1 + x * 15}:** ${track.info.title} - ${track.info.author} \`${
                                    track.info.isStream ? '∞' : player.ms(track.info.length)
                                }\` (${track.info.requester.toString()})`,
                            );
                        }
                        const embed = new EmbedBuilder()
                            .setAuthor({
                                name: 'Queue',
                                iconURL: interaction.guild!.iconURL({ size: 4096 }) || undefined,
                            })
                            .setDescription(descriptionLines.join('\n'));
                        paginatedMessage.addPageEmbed(embed);
                    }
                    return paginatedMessage.run(interaction);
                }
                case 'autoplay': {
                    settings.autoplay.enabled = !settings.autoplay.enabled;
                    successResponse(`${client.config.emojis.autoplay} | **Autoplay is now ${settings.autoplay.enabled ? 'enabled' : 'disabled'}.**`);
                    break;
                }
            }
            return;
        } else return;
    },
};
