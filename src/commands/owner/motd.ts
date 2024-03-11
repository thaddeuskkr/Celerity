import { ApplicationCommandOptionType } from 'discord.js';
import type { Command } from '../../types';

export const command: Command = {
    name: 'motd',
    description: 'Sets the message of the day. The message of the day is sent with any response embed every 6 hours.',
    aliases: [],
    checks: ['owner'],
    userPermissions: [],
    options: [
        {
            name: 'text',
            description: 'The message of the day to be set.',
            type: ApplicationCommandOptionType.String,
            required: false,
        },
    ],

    async execute({ client, context, args }) {
        if (!args.length) client.messageContent = '';
        else client.messageContent = args.join(' ');
        await client.db.set('motd', client.messageContent);
        client.logger.debug('Updated MOTD in database');
        client.respond(
            context,
            `${client.config.emojis.success} | **Message of the day has been set to:**\n${client.messageContent.length > 0 ? client.messageContent : 'None'}`,
            'success',
        );
    },
};
