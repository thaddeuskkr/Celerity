import { ApplicationCommandOptionType } from 'discord.js';
import type { Command } from '../../types';

export const command: Command = {
    name: 'move',
    description: 'Move a track within the queue.',
    aliases: ['mv'],
    checks: ['vc', 'samevc', 'playing', 'queue', 'dj'],
    options: [
        {
            name: 'old',
            description: 'The index of the track to move.',
            type: ApplicationCommandOptionType.Integer,
            required: true,
        },
        {
            name: 'new',
            description: 'The new position for the track.',
            type: ApplicationCommandOptionType.Integer,
            required: true,
        },
    ],

    async execute({ client, context, args, player }) {
        const queue = player.queue;
        if (args.length < 2)
            return client.respond(
                context,
                `${client.config.emojis.error} | **Invalid usage.**\nAccepts: \`2 integers, 1 - ${queue.length}\`.`,
                'error',
            );
        const oldPosition = Number(args[0]);
        const newPosition = Number(args[1]);
        if (isNaN(oldPosition)) return client.respond(context, `${client.config.emojis.error} | **Invalid integer 1 (old position).**`, 'error');
        if (isNaN(newPosition)) return client.respond(context, `${client.config.emojis.error} | **Invalid integer 2 (new position).**`, 'error');
        if (oldPosition < 1 || oldPosition > queue.length)
            return client.respond(
                context,
                `${client.config.emojis.error} | **Invalid integer 1 (old position).**\nAccepts: \`1 - ${queue.length}\`.`,
                'error',
            );
        if (newPosition < 1 || newPosition > queue.length)
            return client.respond(
                context,
                `${client.config.emojis.error} | **Invalid integer 2 (new position).**\nAccepts: \`1 - ${queue.length}\`.`,
                'error',
            );
        const track = player.queue.move(Math.round(oldPosition) - 1, Math.round(newPosition) - 1);
        return client.respond(
            context,
            `${client.config.emojis.move} | **Moved [${track.info.title} by ${track.info.author}](${track.info.uri}) to position __${newPosition}__ in the queue.**`,
            'success',
        );
    },
};
