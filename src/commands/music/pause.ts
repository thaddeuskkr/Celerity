import type { Command } from '../../types';

export const command: Command = {
    name: 'pause',
    description: 'Pauses the music.',
    aliases: [],
    checks: [ 'vc', 'samevc', 'playing', 'dj' ],
    options: [],

    async execute({ client, context, player }) {
        const current = player.current!;
        if (player.player.paused) {
            await player.player.setPaused(false);
            return client.respond(context.channel, `${ client.config.emojis.resume } | **Resumed [${ current.info.title } by ${ current.info.author }](${ current.info.uri }).**`, 'success');
        }
        await player.player.setPaused(true);
        return client.respond(context.channel, `${ client.config.emojis.pause } | **Paused [${ current.info.title } by ${ current.info.author }](${ current.info.uri }).**`, 'success');
    }
};