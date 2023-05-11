import { EmbedBuilder } from 'discord.js';
import type { Command } from '../../types';

export const command: Command = {
    name: 'nowplaying',
    description: 'Returns details regarding the currently playing track.',
    aliases: [ 'np', 'now', 'playing', 'current' ],
    checks: [ 'playing' ],
    options: [],

    async execute({ client, context, player, settings }) {
        const current = player.current!;
        let sourceEmoji: string;
        if (!hasSourceEmoji(player.current!.info.sourceName)) sourceEmoji = client.config.emojis.playing;
        else sourceEmoji = client.config.emojis.sources[player.current!.info.sourceName];
        const embed = new EmbedBuilder()
            .setColor(settings.color)
            .setDescription(
                `\`${ player.ms(player.player.position) }\` ${ createNowPlayingBar(player.position, current.info.length, 30) } \`${ player.ms(current.info.length) }\`\n` +
                '**__NOW PLAYING__**\n' +
                `${ sourceEmoji } | [${ current.info.title } by ${ current.info.author }](${ current.info.uri })\n` +
                `**Requested by:** ${ current.info.requester.user.toString() }`
            )
            .setFooter({ text: `${ player.player.paused ? '⏸️ | ' : '' }🔊 ${ (player.player.filters.volume || 1) * 100 }% | ${ player.queue.length } track(s) in queue` });
        return client.respond(context.channel, embed, 'none');

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