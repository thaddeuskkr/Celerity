import type { Command } from '../../types';
import { ApplicationCommandOptionType, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

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
            required: false,
        },
    ],

    async execute({ client, context, settings, args }) {
        if (!args.length) {
            return client.respond(
                context,
                new EmbedBuilder()
                    .setColor(settings.color)
                    .setDescription(
                        `**Here is a list of prefixes I respond to:**\n${settings.prefixes
                            .map((prefix) => `- \`${prefix}\``)
                            .join('\n')}\n- \`@${client.user?.username}\``,
                    ),
                'none',
            );
        }
        const prefixes = splitBySpacesWithQuotes(args.join(' '));
        settings.prefixes = prefixes;
        const embed = new EmbedBuilder()
            .setColor('#A6E3A1')
            .setDescription(
                `${client.config.emojis.success} | **I will now respond to commands prefixed by the following:**\n${prefixes
                    .map((prefix) => `- \`${client.util.escapeBackticks(prefix)}\``)
                    .join('\n')}\n- \`@${client.user?.username}\``,
            );
        client.respond(context, embed, 'none');
        return;
    },
};

function splitBySpacesWithQuotes(str: string): string[] {
    const regex = /[^\s"]+|"([^"]*)"/gi;
    const result = [];
    let match;

    do {
        match = regex.exec(str);
        if (match !== null) {
            result.push(match[1] ? match[1] : match[0]);
        }
    } while (match !== null);

    return result;
}
