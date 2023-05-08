import type { Event } from '../types';
import type { Guild } from 'discord.js';

export const event: Event = {
    name: 'guildCreate',
    once: false,
    emitter: 'client',

    async run(client, guild: Guild) {
        client.logger.info(`Added to server: ${ guild.name } (${ guild.id })`);
    }
};