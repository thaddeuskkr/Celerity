import { ApplicationCommandOptionType } from 'discord.js';
import type { Command } from '../../types';

export const command: Command = {
    name: 'seek',
    description: 'Seeks to a specific position in the current track.',
    aliases: [],
    examples: ['{p}seek 30', '{p}seek 1:00', '{p}seek 1:07:27'],
    checks: ['vc', 'samevc', 'playing', 'dj'],
    options: [
        {
            name: 'position',
            description: 'The new position to seek to. (format: hh:mm:ss • e.g. 1:00:00, 30, 7:47)',
            type: ApplicationCommandOptionType.String,
            required: true
        }
    ],

    async execute({ client, context, args, player }) {
        const position = args.join(' ');
        const ms = convertToMs(position);
        if (!ms)
            return client.respond(context, `${client.config.emojis.error} | **Invalid position.**\nAccepts: \`hh:mm:ss • e.g. 1:00:00, 30, 7:47\`.`, 'error');
        if (ms < 0 || ms > player.current!.info.length)
            return client.respond(
                context,
                `${client.config.emojis.error} | **Invalid position.**\nAccepts: \`0:00 - ${player.ms(player.current!.info.length)}\`.`,
                'error'
            );
        client.respond(
            context,
            `${client.config.emojis.seek} | **Seeked to \`${player.ms(ms)}\` in [${player.current!.info.title} by ${player.current!.info.author}](${
                player.current!.info.uri
            }).**`,
            'success'
        );
        return await player.player.seekTo(ms);

        function convertToMs(position: string) {
            const parts = position.split(':').reverse();
            let ms = 0;
            for (let i = 0; i < parts.length; i++) {
                if (Number.isNaN(Number.parseInt(parts[i]!))) return null;
                ms += Number.parseInt(parts[i]!) * 60 ** i;
            }
            return ms * 1000;
        }
    }
};
