import type { Command } from '../../types';

export const command: Command = {
    name: 'previous',
    description: 'Returns to the previous track.',
    aliases: ['prev', 'pv', 'pre'],
    checks: ['vc', 'samevc', 'player', 'dj'],
    options: [],

    async execute({ client, context, player, settings }) {
        if (!player.previous.length) return client.respond(context.channel, `${client.config.emojis.error} | **No previous tracks.**`, 'error');
        if (player.loop === 'track') player.setLoop('off');
        const prev = player.previous.shift();
        player.previousUsed = true;
        player.queue.unshift(player.current!);
        player.queue.unshift(prev!);
        await player.player.stopTrack();
        // player.player.setPaused(false);
        if (!settings.announceNowPlaying)
            client.respond(
                context.channel,
                `${client.config.emojis.previous} | **Returned to [${prev!.info.title} by ${prev!.info.author}](${prev!.info.uri}).**`,
                'success',
            );
    },
};
