import type { Command } from '../../types';

export const command: Command = {
    name: 'skip',
    description: 'Skips the currently playing track.',
    aliases: ['s'],
    examples: ['{p}skip'],
    checks: ['vc', 'samevc', 'playing', 'dj'],
    options: [],

    async execute({ client, context, player }) {
        if (player.loop === 'track') player.setLoop('off');
        client.respond(
            context,
            `${client.config.emojis.skip} | **Skipped [${player.current!.info.title} by ${player.current!.info.author}](${player.current!.info.uri}).**`,
            'success'
        );
        player.current!.skipped = true;
        await player.player.stopTrack();
    }
};
