import type { Command } from '../../types';

export const command: Command = {
    name: 'shuffle',
    description: 'Shuffles the queue.',
    aliases: ['sh'],
    examples: ['{p}shuffle'],
    checks: ['vc', 'samevc', 'playing', 'queue', 'dj'],
    options: [],

    execute({ client, context, player }) {
        player.queue.shuffle();
        client.respond(context, `${client.config.emojis.shuffle} | **Shuffled ${player.queue.length} tracks.**`, 'success');
    }
};
