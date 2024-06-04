import { ApplicationCommandOptionType } from 'discord.js';
import type { Command } from '../../types';

export const command: Command = {
    name: 'autoplay',
    description: 'Enables or disables autoplay. Toggles if no arguments are provided.',
    aliases: ['ap'],
    examples: ['{p}autoplay', '{p}autoplay on', '{p}autoplay off'],
    checks: ['dj'],
    options: [
        {
            name: 'enabled',
            description: 'Whether autoplay is enabled.',
            type: ApplicationCommandOptionType.Boolean,
            required: false
        }
    ],

    execute({ client, context, args, settings }) {
        if (args.length && args[0]) {
            if (['true', 'on', 'enable'].includes(args[0].toLowerCase())) {
                settings.autoplay.enabled = true;
            } else if (['false', 'off', 'disable'].includes(args[0].toLowerCase())) {
                settings.autoplay.enabled = false;
            }
        } else {
            settings.autoplay.enabled = !settings.autoplay.enabled;
        }
        return client.respond(
            context,
            `${client.config.emojis.autoplay} | **Autoplay is now ${settings.autoplay.enabled ? 'enabled' : 'disabled'}.**`,
            'success'
        );
    }
};
