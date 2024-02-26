import type { Command } from '../../types';

export const command: Command = {
    name: 'rewind',
    description: 'Restarts the current track.',
    aliases: ['rw'],
    checks: ['vc', 'samevc', 'playing', 'dj'],
    options: [],

    async execute({ client, context, player }) {
        const track = player.current!;
        await player.player.seekTo(0);
        client.respond(
            context,
            `${client.config.emojis.rewind} | **Rewound [${track.info.title} by ${track.info.author}](${track.info.uri}).**`,
            'success',
        );
    },
};
