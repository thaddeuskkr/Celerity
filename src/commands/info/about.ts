import { EmbedBuilder } from 'discord.js';
import tags from 'common-tags';
import ms from 'pretty-ms';
import type { Command } from '../../types';

export const command: Command = {
    name: 'about',
    description: 'Returns information about Celerity.',
    aliases: ['abt'],
    checks: [],
    options: [],

    async execute({ client, context, settings }) {
        if (!client.user) return;
        client.respond(
            context,
            new EmbedBuilder()
                .setAuthor({ name: client.user.username, iconURL: client.user.displayAvatarURL({ size: 4096 }) })
                .setTitle('About')
                .setURL('https://celerity.tkkr.dev')
                .setDescription(
                    tags.stripIndents`
                        *Celerity is a free advanced music Discord bot created with love by [\`@t.kkr\`](https://tkkr.dev) that promises to be fast, performant and feature-rich, without neglecting audio quality or user-friendliness.*

                        Celerity is programmed in [TypeScript](https://www.typescriptlang.org/) using [Node.js®](https://nodejs.org) - and utilises [discord.js](https://discord.js.org) v${client.dependencies['discord.js']?.replace('^', '')} and [Lavalink](https://lavalink.dev). Celerity was created on <t:1682870400:D> (<t:1682870400:R>) and is currently on version \`${client.version}\`. This instance of Celerity has been running for ${ms(process.uptime() * 1000, { verbose: true, secondsDecimalDigits: 0, millisecondsDecimalDigits: 0 })}. 
                        
                        Celerity receives constant updates and improvements, and its developer is always open to suggestions and feedback. Please do note that Celerity is developed in its developer's free time, so updates may not be as frequent as one might expect.

                        **To contact the developer, please drop an email to \`tk@tkkr.dev\` or send a text to \`@t.kkr\` on Discord.**

                        [Invite Celerity to your server](https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=279176399888&scope=bot%20applications.commands) • [Vote for Celerity on top.gg](https://top.gg/bot/${client.user.id}/vote)
                    `,
                )
                .setColor(settings.color),
            'none',
        );
    },
};
