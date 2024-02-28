import { ApplicationCommandOptionType } from 'discord.js';
import type { Command } from '../../types';

export const command: Command = {
    name: 'maintenance',
    description: 'Toggles maintenance mode, with an optional message.',
    aliases: [],
    checks: ['owner'],
    userPermissions: [],
    options: [
        {
            name: 'text',
            description: 'The maintenance message.',
            type: ApplicationCommandOptionType.String,
            required: false,
        },
    ],

    async execute({ client, context, args }) {
        client.maintenance.active = !client.maintenance.active;
        client.maintenance.message = args.length ? args.join(' ') : '';
        client.respond(context, `${client.config.emojis.success} | **Maintenance mode is now ${client.maintenance.active ? 'enabled' : 'disabled'}${client.maintenance.message.length ? `, with the following message:**\n${client.maintenance.message}` : '.**'}`, 'success');
    },
};
