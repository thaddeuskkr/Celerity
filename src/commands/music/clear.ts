import type { Command } from '../../types';

export const command: Command = {
    name: 'clear',
    description: 'Clears the queue.',
    aliases: ['clr'],
    checks: ['vc', 'samevc', 'playing', 'queue', 'dj'],
    options: [],

    async execute({ client, context, player }) {
        client.respond(context, `${client.config.emojis.clear} | **Cleared the queue of ${player.queue.length} track(s).**`, 'success');
        player.queue.clear();
    },
};
