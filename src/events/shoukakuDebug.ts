import type { Event } from '../types';

export const event: Event = {
    name: 'debug',
    once: false,
    emitter: 'shoukaku',

    async run(client, _, info: string) {
        if (client.config.logLavalinkUpdates.toString() === 'false') return;
        else client.logger.debug(info);
    },
};
