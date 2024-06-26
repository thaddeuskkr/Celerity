import { ApplicationCommandOptionType } from 'discord.js';
import type { Command } from '../../types';

export const command: Command = {
    name: 'volume',
    description: 'Modifies the volume of the player.',
    aliases: ['vol'],
    examples: ['{p}volume', '{p}volume 50'],
    checks: ['vc', 'samevc', 'playing', 'dj'],
    options: [
        {
            name: 'volume',
            description: 'The new volume, in %. Accepts: `0 - 250`.',
            type: ApplicationCommandOptionType.Integer,
            required: false
        }
    ],

    async execute({ client, context, args, player }) {
        if (!args.length) return client.respond(context, `${client.config.emojis.volume} | **Currently playing at ${player.player.volume}% volume.**`, 'info');
        const newVolume = Number(args[0]);
        if (Number.isNaN(newVolume)) return client.respond(context, `${client.config.emojis.error} | **Invalid integer.**`, 'error');
        if ((newVolume > 250 || newVolume < 0) && !(args.includes('--override') || args.includes('-o')))
            return client.respond(context, `${client.config.emojis.error} | **Invalid integer.**\nAccepts: \`0 - 250\`.`, 'error');
        await player.player.setGlobalVolume(newVolume);
        return client.respond(context, `${client.config.emojis.volume} | **Player volume set to __${newVolume}%__.**`, 'success');
    }
};
