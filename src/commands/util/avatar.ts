import type { Command } from '../../types';
import { ApplicationCommandOptionType, EmbedBuilder } from 'discord.js';

export const command: Command = {
    name: 'avatar',
    description: 'Sends your avatar back. Specify another user to get their avatar instead.',
    aliases: ['av', 'pfp'],
    checks: [],
    options: [
        {
            name: 'user',
            description: 'The user to get the avatar for. Could be a mention or a user ID.',
            type: ApplicationCommandOptionType.User,
            required: false,
        },
    ],

    async execute({ client, context, args, settings }) {
        let user = context.author;
        if (context.mentions.users.size > 0) user = context.mentions.users.first()!;
        else if (args.length) {
            if (!args[0]) return client.respond(context.channel, `${client.config.emojis.error} | **User ID not provided.**`, 'error');
            await context.guild?.members.fetch(); // I can see this becoming a huge memory issue in the future, but we'll have to see.
            const fetchedUser =
                context.guild!.members.cache.find((m) => m.user.username.toLowerCase() === args.join(' ').toLowerCase())?.user ||
                context.guild!.members.cache.find((m) => m.user.globalName?.toLowerCase() === args.join(' ').toLowerCase())?.user ||
                context.guild!.members.cache.find((m) => m.nickname?.toLowerCase() === args.join(' ').toLowerCase())?.user ||
                (await client.users.fetch(args[0]));
            if (fetchedUser) user = fetchedUser;
            else return client.respond(context.channel, `${client.config.emojis.error} | **Invalid user.**`, 'error');
        }
        const avatar = user.avatarURL({ size: 4096, forceStatic: false });
        if (!avatar) return client.respond(context.channel, `${client.config.emojis.error} | **No avatar found.**`, 'error');
        else {
            const embed = new EmbedBuilder().setAuthor({ name: `@${user.username}` }).setImage(avatar);
            return client.respond(context.channel, embed, settings.color);
        }
    },
};
