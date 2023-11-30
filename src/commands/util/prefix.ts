import type { Command } from '../../types';
import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export const command: Command = {
    name: 'prefix',
    description: 'Sets the server prefix(es) that Celerity responds to.',
    aliases: ['pre', 'prefixes'],
    checks: [],
    userPermissions: [PermissionFlagsBits.ManageMessages],
    options: [],

    async execute({ client, context, settings, args }) {
        if (!args.length) {
            return client.respond(
                context.channel,
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
                `${client.config.emojis.success} | **Celerity will now respond to commands prefixed by the following:**\n${prefixes
                    .map((prefix) => `- \`${client.util.escapeBackticks(prefix)}\``)
                    .join('\n')}`,
            );
        client.respond(context.channel, embed, 'none');
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
