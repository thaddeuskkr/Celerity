import tags from 'common-tags';
import { EmbedBuilder } from 'discord.js';
import ms from 'pretty-ms';
import type { Command } from '../../types';

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

export const command: Command = {
    name: 'about',
    description: 'Returns information about Celerity.',
    aliases: ['abt'],
    examples: ['{p}about'],
    checks: [],
    options: [],

    execute({ client, context, settings }) {
        if (!client.user) return;
        const lines = require('../../../lines.json');
        let userCount = 0;
        for (const guild of client.guilds.cache.values()) userCount += guild.memberCount;
        client.respond(
            context,
            new EmbedBuilder()
                .setAuthor({ name: client.user.username, iconURL: client.user.displayAvatarURL({ size: 4096 }) })
                .setTitle('About')
                .setURL('https://celerity.tkkr.dev')
                .setDescription(
                    tags.stripIndents`
                        *Celerity is a free advanced music Discord bot created by [\`@t.kkr\`](https://tkkr.dev) that promises to be fast, performant and feature-rich, without neglecting audio quality or user-friendliness.*

                        Celerity is programmed in [TypeScript](https://www.typescriptlang.org/) and is currently running on [Node.js®](https://nodejs.org) ${
                            process.version
                        }. Celerity utilises [discord.js](https://discord.js.org) v${require('discord.js').version}, along with [Lavalink](https://lavalink.dev) to play high-quality audio without sacrificing performance.
                        
                        Celerity was created on <t:1682870400:D> (<t:1682870400:R>) and is currently on version \`${client.version}\`, with ${
                            lines.SUM.code
                        } total lines of code in its codebase (not including libraries). This instance of Celerity has been running for ${ms(
                            process.uptime() * 1000,
                            { verbose: true, secondsDecimalDigits: 0, millisecondsDecimalDigits: 0 }
                        )}.

                        Celerity is in **${client.guilds.cache.size} servers** and serves **${userCount} users**.

                        **To contact the developer, please drop an email to \`tk@tkkr.dev\` or send a text to \`@t.kkr\` on Discord.**

                        [Invite Celerity to your server](https://discord.com/oauth2/authorize?client_id=${
                            client.user.id
                        }&permissions=279176399888&scope=bot%20applications.commands) • [Vote for Celerity on top.gg](https://top.gg/bot/${client.user.id}/vote)
                    `
                )
                .setColor(settings.color),
            'none'
        );
    }
};
