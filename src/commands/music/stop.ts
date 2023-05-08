import type { Command } from '../../types';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export const command: Command = {
    name: 'stop',
    description: 'Stops the player, but keeps Celerity connected.',
    aliases: [ 'st' ],
    checks: [ 'vc', 'samevc', 'playing', 'dj' ],
    options: [],

    async execute({ client, context, player }) {
        if (player.queue.length) player.queue.length = 0;
        if (player.autoplayTracks.length) player.autoplayTracks.length = 0;
        player.loop = 'off';
        player.stopped = true;
        await player.player.stopTrack();
        const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('disconnect')
                    .setLabel('Disconnect')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji(client.config.emojis.disconnect)
            );
        client.respond(context.channel, `${ client.config.emojis.stop } | **Stopped the player.**`, 'success', { components: [ row ] });
    }
};