import type { Guild } from 'discord.js';
import type { Event } from '../types';

export const event: Event = {
    name: 'guildDelete',
    once: false,
    emitter: 'client',

    run(client, guild: Guild) {
        client.logger.info(`Removed from server: ${guild.name} (${guild.id})`);
    }
};
