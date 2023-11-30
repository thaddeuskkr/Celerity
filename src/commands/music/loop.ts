import { ApplicationCommandOptionType } from 'discord.js';
import type { Command } from '../../types';

export const command: Command = {
    name: 'loop',
    description: 'Changes the loop mode. Toggles if no arguments are provided.',
    aliases: [],
    checks: ['vc', 'samevc', 'playing', 'dj'],
    options: [
        {
            name: 'mode',
            description: 'Loop mode. Accepts: `off`, `track`, `queue`.',
            type: ApplicationCommandOptionType.String,
            choices: [
                {
                    name: 'off',
                    value: 'off',
                },
                {
                    name: 'track',
                    value: 'track',
                },
                {
                    name: 'queue',
                    value: 'queue',
                },
            ],
            required: false,
        },
    ],

    async execute({ client, context, args, player }) {
        if (!args.length) {
            if (player.loop === 'off') player.setLoop('track');
            else if (player.loop === 'track') player.setLoop('queue');
            else if (player.loop === 'queue') player.setLoop('off');
        } else {
            if (args[0] === 'off' || args[0] === 'o') player.setLoop('off');
            else if (args[0] === 'track' || args[0] === 't' || args[0] === 'one') player.setLoop('track');
            else if (args[0] === 'queue' || args[0] === 'q' || args[0] === 'all') player.setLoop('queue');
            else
                return client.respond(
                    context.channel,
                    `${client.config.emojis.error} | **Invalid loop mode.**\nAccepts: \`off\`, \`track\`, \`queue\`.`,
                    'error',
                );
        }
        return client.respond(
            context.channel,
            `${
                player.loop === 'off'
                    ? client.config.emojis.loopOff
                    : player.loop === 'queue'
                      ? client.config.emojis.loopQueue
                      : client.config.emojis.loopTrack
            } | **${player.loop === 'off' ? 'Loop disabled' : player.loop === 'queue' ? 'Queue loop enabled' : 'Track loop enabled'}.**`,
            'success',
        );
    },
};
