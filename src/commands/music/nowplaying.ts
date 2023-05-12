import { ApplicationCommandOptionType, EmbedBuilder } from 'discord.js';
import type { Command } from '../../types';

export const command: Command = {
    name: 'nowplaying',
    description: 'Returns details regarding the currently playing track.',
    aliases: [ 'np', 'now', 'playing', 'current' ],
    checks: [ 'playing' ],
    options: [
        {
            name: 'dynamic',
            description: 'If the now playing message should update every few seconds. (-d / --dynamic)',
            type: ApplicationCommandOptionType.Boolean,
            required: false
        }
    ],

    async execute({ client, context, player, settings, args }) {
        let dynamic = false;
        if (args.length && (args.includes('-d') || args.includes('--dynamic'))) dynamic = true;
        const embed = getEmbed();
        if (!dynamic) return client.respond(context.channel, embed, 'none');
        else {
            const message = await context.channel.send({ embeds: [getEmbed()] });
            const interval = setInterval(() => {
                message.edit({ embeds: [ getEmbed() ] });
            }, 5000);
            player.player.once('end', () => clearInterval(interval));
        }

        function getEmbed() {
            const current = player.current!;
            let sourceEmoji: string;
            if (!hasSourceEmoji(player.current!.info.sourceName)) sourceEmoji = client.config.emojis.playing;
            else sourceEmoji = client.config.emojis.sources[player.current!.info.sourceName];
            return new EmbedBuilder()
                .setColor(settings.color)
                .setImage(player.current!.info.artworkUrl || null)
                .setDescription(
                    `\`${ player.ms(player.player.position) }\` ${ createNowPlayingBar(player.position, current.info.length, 30) } \`${ player.ms(current.info.length) }\`\n` +
                    '**__NOW PLAYING__**\n' +
                    `${ sourceEmoji } | [${ current.info.title } by ${ current.info.author }](${ current.info.uri })\n` +
                    `**Requested by:** ${ current.info.requester.user.toString() }`
                )
                .setFooter({ text: `${ player.player.paused ? '⏸️ | ' : '' }🔊 ${ (player.player.filters.volume || 1) * 100 }% | ${ player.queue.length } track(s) in queue` });
        }

        function hasSourceEmoji(value: string): value is keyof typeof client.config.emojis.sources {
            return value in client.config.emojis.sources;
        }

        function createNowPlayingBar(current: number, duration: number, size = 20) {
            if (duration === 0) return;
            const currentSeconds = Math.floor(current / 1000);
            const totalSeconds = Math.floor(duration / 1000);
            const percentage = currentSeconds / totalSeconds;
            const progress = Math.round((size * percentage));
            const emptyProgress = size - progress;
            const progressText = '═'.repeat(progress);
            const emptyProgressText = '═'.repeat(emptyProgress);
            return `\`╞${ progressText }▰${ emptyProgressText }╡\``;
        }
    }
};