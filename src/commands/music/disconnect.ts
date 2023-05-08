import type { Command } from '../../types';

export const command: Command = {
    name: 'disconnect',
    description: 'Stops the player and disconnects Celerity.',
    aliases: [ 'dc', 'fuckoff', 'leave' ],
    checks: [ 'vc', 'samevc', 'dj', 'player' ],
    options: [],

    async execute({ client, context, player }) {
        client.respond(context.channel, `${ client.config.emojis.disconnect } | **Disconnected from <#${ player.player.connection.channelId }>.**`, 'success');
        player.player.connection.disconnect().then();
        player.destroy();
        return;
    }
};