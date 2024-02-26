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
                    `- **${guild.name} (\`${guild.id}\`)** | ${player.queue.length} (\`${player.ms(player.queue.totalDuration)}\`) tracks in queue | ${player.stopped ? 'Stopped' : player.player.paused ? 'Paused' : 'Playing'}${player.current ? ` [**${player.current.info.title}** by **${player.current.info.author}**](${player.current.info.uri}) \`${player.ms(player.current.info.length)}\`` : ''}`,
                );
            });
            return context.reply(`# Active players\n${playerList.join('\n')}`);
        }
    },
};
