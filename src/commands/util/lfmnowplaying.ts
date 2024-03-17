import axios from 'axios';
import type { Command } from '../../types';
import { ApplicationCommandOptionType, EmbedBuilder } from 'discord.js';

export const command: Command = {
    name: 'lfmnowplaying',
    description: 'Shows the currently playing track for the provided Last.fm user.',
    aliases: ['lfmnp', 'nplfm', 'lnp', 'npl'],
    examples: ['{p}lfmnowplaying', '{p}lfmnowplaying thaddeuskkr'],
    checks: [],
    options: [
        {
            name: 'user',
            description: 'The user to show the track for. If not provided, defaults to your Discord username.',
            type: ApplicationCommandOptionType.String,
            required: false,
        },
    ],

    async execute({ client, context, args, settings }) {
        let user = context.author.username;
        if (args.length) {
            user = args.join(' ');
        }
        const image = `https://lfm.tkkr.dev/nowplaying?username=${user}&transparent=true&width=1000&show_username=false&${Date.now()}`;
        axios.get(image)
            .then(() => {
                return context.reply({ embeds: [
                    new EmbedBuilder()
                        .setImage(image)
                        .setColor(settings.color)
                        .setTimestamp()
                        .setAuthor({ name: `Now Playing • ${user}`, url: `https://www.last.fm/user/${user}` })
                        .setFooter({ text: 'Powered by lfm.tkkr.dev' })
                ], allowedMentions: { repliedUser: false } });
            })
            .catch(err => {
                if (err.response) return client.respond(context, `${client.config.emojis.error} | **Failed to get information for \`${user}\`.**\nDo ensure you typed the name correctly.`, 'error');
                else if (err.request) return client.respond(context, `${client.config.emojis.error} | **No response from \`lfm.tkkr.dev\`.**\nPlease try again later.`, 'error');
            });
    },
};
