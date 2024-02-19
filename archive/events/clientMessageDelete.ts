import type { Event, Snipe } from '../types';
import type { Message } from 'discord.js';

export const event: Event = {
    name: 'messageDelete',
    once: false,
    emitter: 'client',

    async run(client, message: Message) {
        let snipes: Snipe[] | undefined = await client.db.get('snipes');
        if (!snipes) snipes = [];
        snipes.unshift({
            content: message.content,
            embeds: message.embeds,
            attachments: message.attachments.map((a) => a),
            channel: message.channel.id,
            author: message.author.id,
            timestamp: message.createdTimestamp,
        });
        await client.db.set('snipes', snipes);
    },
};
