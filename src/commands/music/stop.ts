import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import type { Command } from '../../types';

export const command: Command = {
    name: 'stop',
    description: 'Stops the player, but keeps Celerity connected.',
    aliases: ['st'],
    examples: ['{p}stop'],
    checks: ['vc', 'samevc', 'playing', 'dj'],
    options: [],

    async execute({ client, context, player }) {
        if (player.queue.length) player.queue.clear();
        if (player.autoplayQueue.length) player.autoplayQueue.clear();
        player.setLoop('off');
        player.stopped = true;
        await player.player.stopTrack();
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setCustomId('disconnect').setLabel('Disconnect').setStyle(ButtonStyle.Danger).setEmoji(client.config.emojis.disconnect)
        );
        client.respond(context, `${client.config.emojis.stop} | **Stopped the player.**`, 'success', { components: [row] });
    }
};
