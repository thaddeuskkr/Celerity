import { EmbedBuilder } from 'discord.js';
import type { Command } from '../../types';

export const command: Command = {
    name: 'ping',
    description: "Checks Celerity's latency.",
    aliases: ['pong'],
    examples: ['{p}ping'],
    checks: [],
    options: [],

    async execute({ client, context, player, settings }) {
        const msg = await context.reply({
            embeds: [new EmbedBuilder().setDescription(`${client.config.emojis.loading} | **Pinging...**`).setColor('#F5C2E7')],
            allowedMentions: { repliedUser: false }
        });
        msg.edit({
            embeds: [
                new EmbedBuilder()
                    .setDescription(
                        `${client.config.emojis.ping} | **Pong!**\n**API latency:** \`${Math.round(client.ws.ping)}ms\`\n**Message round-trip time:** \`${
                            msg.createdTimestamp - context.createdTimestamp
                        }ms\`${player ? `\n**Player latency:** \`${player.player.ping}ms\`` : ''}`
                    )
                    .setColor(settings.color)
            ]
        });
    }
};
