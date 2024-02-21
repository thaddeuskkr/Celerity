import type { Command } from '../../types';

export const command: Command = {
    name: 'skip',
    description: 'Skips the currently playing track.',
    aliases: ['s'],
    checks: ['vc', 'samevc', 'playing', 'dj'],
    options: [],

    async execute({ client, context, player }) {
        if (player.loop === 'track') player.setLoop('off');
        client.respond(
            context.channel,
            `${client.config.emojis.skip} | **Skipped [${player.current!.info.title} by ${player.current!.info.author}](${
                player.current!.info.uri
            }).**`,
            'success',
        );
        await player.player.stopTrack();
    },
};
