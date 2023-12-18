import { ApplicationCommandOptionType, EmbedBuilder } from 'discord.js';
import type { Command } from '../../types';

export const command: Command = {
    name: 'nowplaying',
    description: 'Returns details regarding the currently playing track.',
    aliases: ['np', 'now', 'playing', 'current'],
    checks: ['playing'],
    options: [
        {
            name: 'dynamic',
            description: 'If the now playing message should update every few seconds. (-d / --dynamic)',
            type: ApplicationCommandOptionType.Boolean,
            required: false,
        },
        {
            name: 'timeout',
            description:
                'The amount of time, in minutes, for which the embed should be updated. By default, stops at the end of the track. (-t / --timeout)',
            type: ApplicationCommandOptionType.Integer,
            required: false,
        },
    ],

    async execute({ client, context, player, settings, args }) {
        let dynamic = false;
        let timeout = 0;
        if (args.length && (args.includes('-d') || args.includes('--dynamic'))) dynamic = true;
        if (args.length && (args.includes('-t') || args.includes('--timeout'))) {
            let index = -1;
            if (args.indexOf('--timeout') !== -1) index = args.indexOf('--timeout');
            if (args.indexOf('-t') !== -1) index = args.indexOf('-t');
            if (isNaN(Number(args[index + 1])))
                return client.respond(context.channel, `${client.config.emojis.error} | **Invalid integer.**\nAccepts: \`-1 - ∞\`.`, 'error');
            else timeout = Number(args[index + 1]);
        }
        const embed = getEmbed();
        if (!dynamic) return client.respond(context.channel, embed, 'none');
        else {
            const message = await context.channel.send({ embeds: [getEmbed()] });
            const interval = setInterval(async () => {
                if (!player.current) return;
                if (!player) clearInterval(interval);
                await message.edit({ embeds: [getEmbed()] });
            }, 5000);
            if (timeout === 0) {
                player.player.once('end', async () => {
                    await message.edit({ embeds: [getEmbed()] });
                    clearInterval(interval);
                });
            } else if (timeout === -1) {
                client.on('voiceStateUpdate', (oldState, newState) => {
                    if (oldState.guild.id !== context.guild!.id) return;
                    if (oldState.channelId === client.shoukaku.connections.get(oldState.guild.id)?.channelId && !newState.channelId)
                        clearInterval(interval);
                });
            } else setTimeout(() => clearInterval(interval), timeout * 60 * 1000);
        }
        console.log(dynamic, timeout);

        function getEmbed() {
            const current = player.current!;
            let sourceEmoji: string;
            let sourceFullName: string;
            if (!hasSourceEmoji(player.current!.info.sourceName)) sourceEmoji = client.config.emojis.playing;
            else sourceEmoji = client.config.emojis.sources[player.current!.info.sourceName];
            if (!hasSourceFullName(player.current!.info.sourceName)) sourceFullName = 'Unknown';
            else sourceFullName = client.util.fullSourceNames[player.current!.info.sourceName];
            return new EmbedBuilder()
                .setColor(settings.color)
                .setImage(player.current!.info.artworkUrl || null)
                .setDescription(
                    `**[${current.info.title} by ${current.info.author}](${current.info.uri})**\n` +
                        `on ${sourceEmoji} **${sourceFullName}**\n` +
                        `**Requested by:** ${current.info.requester.user.toString()}\n\n` +
                        `\`${player.ms(player.player.position)}\` ${createNowPlayingBar(player.position, current.info.length, 22)} \`${player.ms(
                            current.info.length,
                        )}\`\n`,
                )
                .setFooter({
                    text: `${player.player.paused ? '⏸️ | ' : ''}🔊 ${(player.player.filters.volume || 1) * 100}% | ${
                        player.queue.length
                    } track(s) in queue`,
                });
        }

        function hasSourceEmoji(value: string): value is keyof typeof client.config.emojis.sources {
            return value in client.config.emojis.sources;
        }

        function hasSourceFullName(value: string): value is keyof typeof client.util.fullSourceNames {
            return value in client.util.fullSourceNames;
        }

        function createNowPlayingBar(current: number, duration: number, size = 20) {
            if (duration === 0) return;
            const currentSeconds = Math.floor(current / 1000);
            const totalSeconds = Math.floor(duration / 1000);
            const percentage = currentSeconds / totalSeconds;
            const progress = Math.round(size * percentage);
            const emptyProgress = size - progress;
            const progressText = '═'.repeat(progress);
            const emptyProgressText = '═'.repeat(emptyProgress);
            return `\`╞${progressText}▰${emptyProgressText}╡\``;
        }
    },
};
