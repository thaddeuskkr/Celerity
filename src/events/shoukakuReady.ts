import type { Event } from '../types';

export const event: Event = {
    name: 'ready',
    once: false,
    emitter: 'shoukaku',

    run(client) {
        client.logger.info(
            `Connected to Lavalink - ${client.config.lavalink.secure === 'true' ? 'wss://' : 'ws://'}${client.config.lavalink.host}:${
                client.config.lavalink.port
            }`
        );
    }
};
