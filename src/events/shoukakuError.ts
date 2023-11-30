import type { Event } from '../types';

export const event: Event = {
    name: 'error',
    once: false,
    emitter: 'shoukaku',

    async run(client, _, error: Error) {
        client.logger.error(error);
    },
};
