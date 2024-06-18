import type { Event } from '../types';

export const event: Event = {
    name: 'close',
    once: false,
    emitter: 'shoukaku',

    run(client, _, code: number, reason: string) {
        client.logger.warn(`Lavalink connection closed with code ${code} and reason ${reason}`);
        client.webhook
            .send({
                content: `Celerity's Lavalink connection was **closed** with code **${code}** and reason \`${reason}\`.`,
                username: 'Celerity'
            })
            .catch(() => null);
    }
};
