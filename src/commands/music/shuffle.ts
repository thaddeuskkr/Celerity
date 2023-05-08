import type { Command } from '../../types';

export const command: Command = {
    name: 'shuffle',
    description: 'Shuffles the queue.',
    aliases: [ 'sh' ],
    checks: [ 'vc', 'samevc', 'playing', 'queue', 'dj' ],
    options: [],

    async execute({ client, context, player }) {
        player.queue.shuffle();
        client.respond(context.channel, `${ client.config.emojis.shuffle } | **Shuffled ${ player.queue.length } tracks.**`, 'success');
    }
};