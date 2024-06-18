import type { Event } from '../types';

export const event: Event = {
    name: 'error',
    once: false,
    emitter: 'shoukaku',

    run(client, _, error: Error) {
        client.logger.error(error);
        client.webhook
            .send({
                content: `**Celerity encountered a Lavalink error:**\n\`\`\`js\n${error}\n\`\`\``,
                username: 'Celerity'
            })
            .catch(() => null);
    }
};
