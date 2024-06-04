import type { Guild } from 'discord.js';
import type { Event } from '../types';

export const event: Event = {
    name: 'guildCreate',
    once: false,
    emitter: 'client',

    run(client, guild: Guild) {
        client.logger.info(`Added to server: ${guild.name} (${guild.id})`);
    }
};
