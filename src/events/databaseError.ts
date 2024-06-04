import type { Event } from '../types';

export const event: Event = {
    name: 'error',
    once: false,
    emitter: 'db',

    run(client, error: Error) {
        client.logger.error(error);
    }
};
