import type { Event } from '../types';

export const event: Event = {
    name: 'ready',
    once: false,
    emitter: 'shoukaku',

    async run(client) {
        client.logger.info(`Connected to Lavalink - ${ client.config.lavalinkSecure.toLowerCase() === 'true' ? 'wss://' : 'ws://' }${ client.config.lavalinkUrl }`);
        const node = client.shoukaku.getNode();
        if (!node) return client.logger.warn('No audio node available, all music commands will not work.');
        client.node = node;
        setInterval(async () => {
            const node = client.shoukaku.getNode();
            if (!node) return client.logger.warn('No audio node available, all music commands will not work.');
            client.node = node;
        }, 5000);
    }
};