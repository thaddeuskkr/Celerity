import type { Event } from '../types';

export const event: Event = {
    name: 'ready',
    once: false,
    emitter: 'shoukaku',

    async run(client) {
        client.logger.info(`Connected to Lavalink - ${ client.config.lavalinkSecure.toLowerCase() === 'true' ? 'wss://' : 'ws://' }${ client.config.lavalinkUrl }`);
    }
};
