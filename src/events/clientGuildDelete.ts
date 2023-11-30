import type { Event } from '../types';
import type { Guild } from 'discord.js';

export const event: Event = {
    name: 'guildDelete',
    once: false,
    emitter: 'client',

    async run(client, guild: Guild) {
        client.logger.info(`Removed from server: ${guild.name} (${guild.id})`);
    },
};
