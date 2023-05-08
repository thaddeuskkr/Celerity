import { ApplicationCommandOptionType } from 'discord.js';
import type { Command } from '../../types';

export const command: Command = {
    name: 'remove',
    description: 'Remove a track from the queue.',
    aliases: [ 'rm', 'rmv' ],
    checks: [ 'vc', 'samevc', 'playing', 'queue', 'dj' ],
    options: [
        {
            name: 'track',
            description: 'The index of the track to remove.',
            type: ApplicationCommandOptionType.Integer,
            required: true
        }
    ],

    async execute({ client, context, args, player }) {
        const queue = player.queue;
        const index = Number(args[0]);
        if (isNaN(index)) return client.respond(context.channel, `${ client.config.emojis.error } | **Invalid integer.**`, 'error');
        if (index < 1 || index > queue.length) return client.respond(context.channel, `${ client.config.emojis.error } | **Invalid integer.**\nAccepts: \`1 - ${ queue.length }\`.`, 'error');
        const track = player.queue.remove(index - 1)!;
        return client.respond(context.channel, `${ client.config.emojis.remove } | **Removed [${ track.info.title } by ${ track.info.author }](${ track.info.uri }) from the queue.**`, 'success');
    }
};