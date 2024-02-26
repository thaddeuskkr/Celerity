import type { Command } from '../../types';

export const command: Command = {
    name: 'players',
    description: 'Lists the currently active players.',
    aliases: ['list-players'],
    checks: ['owner'],
    userPermissions: [],
    options: [],

    async execute({ client, context }) {
        const players = client.players;
        if (!players.size) return context.reply('**No active players.**');
        else {
            const playerList: Array<string> = [];
            players.forEach((player) => {
                const guild = player.guild;
                playerList.push(
                    `- **${guild.name} (\`${guild.id}\`)** | *${player.queue.length} (\`${player.ms(player.queue.totalDuration)}\`) tracks in queue. | *${player.stopped ? '*Stopped*' : player.player.paused ? '*Paused*' : '*Playing*'}`,
                );
            });
            return context.reply(`**__Active players__**\n${playerList.join('\n')}`);
        }
    },
};
