import type { Event } from '../types';

export const event: Event = {
    name: 'debug',
    once: false,
    emitter: 'shoukaku',

    async run(client, _, info: string) {
        if (client.config.logLavalinkUpdates.toLowerCase() === 'false' && info.toLowerCase().includes('node status update')) return;
        else client.logger.debug(info);
    },
};
