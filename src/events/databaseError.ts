import type { Event } from '../types';

export const event: Event = {
    name: 'error',
    once: false,
    emitter: 'db',

    run(client, error: Error) {
        client.logger.error(error);
        client.webhook
            .send({
                content: `**Celerity encountered a database error:**\n\`\`\`js\n${error}\n\`\`\``,
                username: 'Celerity'
            })
            .catch(() => null);
    }
};
