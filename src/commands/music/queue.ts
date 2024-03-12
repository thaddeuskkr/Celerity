import { EmbedBuilder } from 'discord.js';
import { CelerityPaginatedMessage } from '../../util/pagination.js';
import _ from 'lodash';
import type { CelerityTrack } from '../../util/track';
import type { Command } from '../../types';

export const command: Command = {
    name: 'queue',
    description: 'Returns a list of tracks in the queue.',
    aliases: ['q', 'tracks', 'list', 'songs'],
    examples: ['{p}queue'],
    checks: ['playing', 'queue'],
    options: [],

    async execute({ client, context, player, settings }) {
        const queue = player.queue;
        const chunkedQueue = _.chunk(queue, 15);
        let loopText = '';
        if (player.loop === 'queue') loopText = '\n🔁 Looping the queue';
        else if (player.loop === 'track') loopText = '\n🔂 Looping the current track';
        const paginatedMessage = new CelerityPaginatedMessage(client, {
            template: new EmbedBuilder()
                .setColor(settings.color)
                .setFooter({ text: `${queue.length} track(s) in queue • Total duration: ${player.ms(queue.totalDuration)}${loopText}` }),
        });
        for (let x = 0; x < chunkedQueue.length; x++) {
            const descriptionLines = [];
            for (let i = 0; i < chunkedQueue[x]!.length; i++) {
                const track: CelerityTrack = chunkedQueue[x]![i]!;
                descriptionLines.push(
                    `**${i + 1 + x * 15}:** ${track.info.title} - ${track.info.author} \`${
                        track.info.isStream ? '∞' : player.ms(track.info.length)
                    }\` (${track.info.requester.toString()})`,
                );
            }
            const embed = new EmbedBuilder()
                .setAuthor({ name: 'Queue', iconURL: context.guild!.iconURL({ size: 4096 }) || undefined })
                .setDescription(descriptionLines.join('\n'));
            paginatedMessage.addPageEmbed(embed);
        }
        return paginatedMessage.run(context);
    },
};
