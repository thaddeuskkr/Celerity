import type { Command } from '../../types';

export const command: Command = {
    name: 'players',
    description: 'Lists the currently active players.',
    aliases: ['list-players'],
    checks: ['owner'],
    userPermissions: [],
    options: [],

    execute({ client, context }) {
        const players = client.players;
        if (!players.size) return client.respond(context, `${client.config.emojis.error} | **No active players.**`, 'error');
        const playerList: Array<string> = [];
        for (const player of players.values()) {
            playerList.push(
                `- **${player.guild.name} (\`${player.guild.id}\`)** | ${player.queue.length} tracks in queue (\`${player.ms(
                    player.queue.totalDuration
                )}\`) | ${player.stopped ? 'Stopped' : player.player.paused ? 'Paused' : 'Playing'}${
                    player.current
                        ? ` [**${player.current.info.title}** by **${player.current.info.author}**](<${player.current.info.uri}>) \`${player.ms(
                              player.position
                          )}\`/\`${player.ms(player.current.info.length)}\``
                        : ''
                }`
            );
        }
        return context.reply({ content: `## Active players\n${playerList.join('\n')}`, allowedMentions: { repliedUser: false } });
    }
};
