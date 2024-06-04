import { ApplicationCommandOptionType, EmbedBuilder } from 'discord.js';
import type { Command } from '../../types';

export const command: Command = {
    name: 'announce',
    description: 'Sends an announcement to all active players.',
    aliases: [],
    checks: ['owner'],
    userPermissions: [],
    options: [
        {
            name: 'text',
            description: 'The text to send to each server.',
            type: ApplicationCommandOptionType.String,
            required: true
        }
    ],

    async execute({ client, context, args }) {
        const players = client.players;
        if (!args.length) return client.respond(context, `${client.config.emojis.error} | **No announcement provided.**`, 'error');
        const announcement = args.join(' ');
        if (!players.size) return client.respond(context, `${client.config.emojis.error} | **No active players.**`, 'error');

        const playerList: Array<string> = [];
        for (const player of players.values()) {
            playerList.push(`- **${player.guild.name} (\`${player.guild.id}\`)**`);
            player.channel.send({
                embeds: [
                    new EmbedBuilder()
                        .setAuthor({ name: `@${context.author.username} - Announcement`, iconURL: context.author.displayAvatarURL({ size: 4096 }) })
                        .setDescription(announcement)
                        .setTimestamp()
                        .setColor('#fab387')
                ]
            });
        }
        await context.reply({ content: `## Announcement sent\n${playerList.join('\n')}`, allowedMentions: { repliedUser: false } });
    }
};
