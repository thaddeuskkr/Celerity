import {
    PaginatedMessage,
    type PaginatedMessageOptions,
    type PaginatedMessagePage
} from '@sapphire/discord.js-utilities';
import { ButtonStyle, ComponentType, EmbedBuilder } from 'discord.js';
import type { Celerity } from './client';

export class CelerityPaginatedMessage extends PaginatedMessage {
    constructor(client: Celerity, options: PaginatedMessageOptions) {
        super(options);
        this.setActions([
            {
                customId: 'previousPage',
                style: ButtonStyle.Primary,
                emoji: client.config.emojis.prevPage,
                type: ComponentType.Button,
                run: ({ handler }) => {
                    if (handler.index === 0) handler.index = handler.pages.length - 1;
                    else --handler.index;
                }
            },
            {
                customId: 'nextPage',
                style: ButtonStyle.Primary,
                emoji: client.config.emojis.nextPage,
                type: ComponentType.Button,
                run: ({ handler }) => {
                    if (handler.index === handler.pages.length - 1) handler.index = 0;
                    else ++handler.index;
                }
            }
        ]);
        this.wrongUserInteractionReply = () => ({
            embeds: [ new EmbedBuilder()
                .setColor('#F38BA8')
                .setDescription(`${ client.config.emojis.error } | **You are not allowed to interact with the buttons on this message.**`) ],
            ephemeral: true,
            allowedMentions: { users: [], roles: [] }
        });
    }

    public override addPage(page: PaginatedMessagePage) {
        this.pages.push(page);
        return this;
    }
}