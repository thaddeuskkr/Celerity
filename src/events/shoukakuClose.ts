import type { Event } from '../types';

export const event: Event = {
    name: 'close',
    once: false,
    emitter: 'shoukaku',

    async run(client, code: number, reason: string) {
        client.logger.warn(`Lavalink connection closed with code ${ code } and reason ${ reason }`);
    }
};