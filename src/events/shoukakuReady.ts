import type { Event } from '../types';

export const event: Event = {
    name: 'ready',
    once: false,
    emitter: 'shoukaku',

    async run(client) {
        client.logger.info(`Connected to Lavalink - ${ client.config.lavalink.secure ? 'wss://' : 'ws://' }${ client.config.lavalink.host }:${ client.config.lavalink.port }`); 
    }
};
