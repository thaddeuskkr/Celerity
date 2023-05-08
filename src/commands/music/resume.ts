import type { Command } from '../../types';

export const command: Command = {
    name: 'resume',
    description: 'Resumes the music.',
    aliases: [ 'res' ],
    checks: [ 'vc', 'samevc', 'playing', 'dj' ],
    options: [],

    async execute({ client, context, player }) {
        const current = player.current!;
        if (!player.player.paused) {
            await player.player.setPaused(true);
            return client.respond(context.channel, `${ client.config.emojis.resume } | **Paused [${ current.info.title } by ${ current.info.author }](${ current.info.uri }).**`, 'success');
        }
        await player.player.setPaused(false);
        return client.respond(context.channel, `${ client.config.emojis.pause } | **Resumed [${ current.info.title } by ${ current.info.author }](${ current.info.uri }).**`, 'success');
    }
};