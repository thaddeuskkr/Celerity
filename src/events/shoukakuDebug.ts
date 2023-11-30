import type { Event } from '../types';

export const event: Event = {
    name: 'debug',
    once: false,
    emitter: 'shoukaku',

    async run(client, _, info: string) {
        client.logger.debug(info);
    },
};
