import type { Command, Snipe } from '../../types';
import { CelerityPaginatedMessage } from '../../util/pagination.js';
import { EmbedBuilder } from 'discord.js';
import tags from 'common-tags';

export const command: Command = {
    name: 'snipe',
    description: 'Snipes the most recently deleted message(s) in your channel.',
    aliases: [ 'sn' ],
    checks: [],
    options: [],

    async execute({ client, context, settings }) {
        let snipes: Snipe[] | undefined = await client.db.get('snipes');
        if (!snipes) snipes = [];
        const channelSnipes = snipes.filter(s => s.channel === context.channel.id);
        if (!channelSnipes.length) return client.respond(context.channel, `${ client.config.emojis.error } | **No deleted messages recorded in this channel.**`, 'error');
        const paginatedMessage = new CelerityPaginatedMessage(client, {
            template: new EmbedBuilder()
                .setColor(settings.color)
        });
        for (let i = 0; i < channelSnipes.length; i++) {
            const snipe = channelSnipes[i]!;
            const user = await context.guild!.members.fetch(snipe.author);
            const embed = new EmbedBuilder()
                .setAuthor({
                    name: user ? `@${ user.user.username }` : 'Unknown user',
                    iconURL: user ? user.user.displayAvatarURL({ size: 4096 }) || undefined : undefined
                })
                .setTimestamp(snipe.timestamp);
            const attachments: string[] = [];
            const embeds: EmbedBuilder[] = snipe.embeds.map(e => new EmbedBuilder(e.data));
            for (let i = 0; i < snipe.attachments.length; i++) {
                const attachment = snipe.attachments[i]!;
                attachments.push(`[${ attachment.name }](${ attachment.url })`);
            }
            embed.setDescription(
                tags.stripIndents`${ attachments.length ? attachments.join(' | ') : '' }
                ${ `**__Message content:__**\n${ snipe.content || 'None' }` }
                ${ snipe.embeds.length > 0 ? '\n*Embeds attached below.*' : '' }`);
            paginatedMessage.addPageEmbeds([embed, ...embeds]);
        }
        return paginatedMessage.run(context);
    }
};