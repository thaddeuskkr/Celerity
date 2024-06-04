import { ApplicationCommandOptionType, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import type { Command } from '../../types';

export const command: Command = {
    name: 'prefix',
    description: 'Sets the server prefix(es) that Celerity responds to.',
    aliases: ['pre', 'prefixes'],
    examples: ['{p}prefix', '{p}prefix !', '{p}prefix ! ? $', '{p}prefix "please do this celerity " ! ?'],
    checks: [],
    userPermissions: [PermissionFlagsBits.ManageMessages],
    options: [
        {
            name: 'prefixes',
            description:
                'The new prefix(es) to set. Accepts a space-separated list of prefixes. Spaces in prefixes can be configured by enclosing the prefix in double quotes. Use `set prefixes` for more information.',
            type: ApplicationCommandOptionType.String,
            required: false
        }
    ],

    async execute({ client, context, settings, args }) {
        if (!args.length) {
            return client.respond(
                context,
                new EmbedBuilder()
                    .setColor(settings.color)
                    .setDescription(
                        `**Here is a list of prefixes I respond to:**\n${settings.prefixes.map((prefix) => `- \`${prefix}\``).join('\n')}\n- \`@${
                            client.user?.username
                        }\``
                    ),
                'none'
            );
        }
        const prefixes = client.util.splitBySpacesWithQuotes(args.join(' '));
        settings.prefixes = prefixes;
        const embed = new EmbedBuilder()
            .setColor('#A6E3A1')
            .setDescription(
                `${client.config.emojis.success} | **I will now respond to commands prefixed by the following:**\n${prefixes
                    .map((prefix) => `- \`${client.util.escapeBackticks(prefix)}\``)
                    .join('\n')}\n- \`@${client.user?.username}\``
            );
        client.respond(context, embed, 'none');
        return;
    }
};
