import { ChannelType, EmbedBuilder, type Message, PermissionsBitField } from 'discord.js';
import _ from 'lodash';
import type { Event } from '../types';

export const event: Event = {
    name: 'messageCreate',
    once: false,
    emitter: 'client',

    async run(client, message: Message) {
        if (!client.ready) return;
        const startTime = performance.now();
        if (!message.guild || message.channel.isDMBased() || !message.member || !client.user || !message.guild.members.me) return;
        let settings = client.guildSettings.get(message.guild.id);
        if (!settings) {
            settings = _.cloneDeep(client.config.defaultSettings);
            client.guildSettings.set(message.guild.id, settings);
        }
        const { prefixes } = settings;
        let prefix: string | undefined = undefined;
        for (let i = 0; i < prefixes.length; i++) {
            if (message.content.toLowerCase().startsWith(prefixes[i]!)) {
                prefix = prefixes[i];
                break;
            }
        }
        if (!prefix && (message.content.startsWith(`<@!${client.user!.id}>`) || message.content.startsWith(`<@${client.user!.id}>`)))
            prefix = client.user!.toString();
        if (message.content === `<@!${client.user!.id}>` || message.content === `<@${client.user!.id}>`) {
            client.respond(
                message,
                new EmbedBuilder()
                    .setColor(settings.color)
                    .setAuthor({ name: 'You mentioned me?', iconURL: client.user.displayAvatarURL({ size: 4096 }) })
                    .setDescription(
                        `**Here is a list of prefixes I respond to:**\n${prefixes.map((prefix) => `- \`${prefix}\``).join('\n')}\n- \`@${
                            client.user?.username
                        }\``
                    ),
                'none'
            );
            return;
        }
        if (!prefix) return;
        const args = message.content.slice(prefix.length).trim().split(/ +/g);
        if (!args.length) return;
        const commandName = args.shift()!.toLowerCase();
        if (!commandName) return;
        const command = client.commands.get(commandName) || client.commands.find((cmd) => cmd.aliases?.includes(commandName));
        if (!command) return;

        if (client.maintenance.active === true && !client.config.owners.includes(message.author.id)) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription(
                            `${client.config.emojis.error} | **Celerity is in maintenance mode. Please try again later.**${
                                client.maintenance.message.length ? `\n${client.maintenance.message}` : ''
                            }`
                        )
                        .setColor('#F38BA8')
                ],
                allowedMentions: { repliedUser: false }
            });
        }

        if (settings.banned.includes(message.author.id)) return errorResponse('You are banned from using Celerity.');
        if (settings.banned.some((id) => message.member!.roles?.cache.has(id))) return errorResponse('One of your roles is banned from using Celerity.');
        if (settings.disabledChannels.includes(message.channel.id)) return errorResponse('Celerity is disabled in this channel.');
        if (message.channel.parentId && settings.disabledChannels.includes(message.channel.parentId))
            return errorResponse('Celerity is disabled in all channels under this category.');
        if (message.member.voice.channel && settings.disabledChannels.includes(message.member.voice.channel.id))
            return errorResponse('Celerity is disabled in your voice channel.');

        const checks = command.checks;
        const userPermissions = command.userPermissions;
        const clientPermissions = command.clientPermissions;
        const player = client.players.get(message.guild.id)!;
        const connection = client.shoukaku.connections.get(message.guild.id);
        if (checks?.length) {
            for (let i = 0; i < checks.length; i++) {
                if (checks[i] === 'vc' && !message.member.voice.channel) return errorResponse("You're not in a voice channel.");
                if (
                    checks[i] === 'samevc' &&
                    message.member.voice.channel &&
                    message.guild.members.me.voice.channel &&
                    message.member.voice.channel.id !== message.guild.members.me.voice.channel.id
                )
                    return errorResponse(`You're not in <#${message.guild.members.me!.voice.channel.id}>.`);
                if (checks[i] === 'joinable' && message.member.voice.channel && !message.member.voice.channel.joinable)
                    return errorResponse(`I don't have permission to join <#${message.member.voice.channel.id}>.`);
                if (
                    checks[i] === 'speakable' &&
                    message.member.voice.channel &&
                    message.member.voice.channel.type !== ChannelType.GuildStageVoice &&
                    !message.member.voice.channel.speakable
                )
                    return errorResponse(`I don't have permission to speak in <#${message.member.voice.channel.id}>.`);
                if (checks[i] === 'player' && !player) return errorResponse("There isn't a player for this server.");
                if (checks[i] === 'connection' && !connection) return errorResponse("There isn't a voice connection in this server.");
                if (checks[i] === 'playing' && (!player || !player.current)) return errorResponse('There is nothing playing.');
                if (checks[i] === 'queue' && (!player || !player.queue.length)) return errorResponse('There are no tracks in the queue.');
                if (
                    checks[i] === 'dj' &&
                    settings.dj.enabled &&
                    settings.dj.role.length > 0 &&
                    message.guild.members.me!.voice.channel &&
                    message.guild.members.me!.voice.channel.members.filter((m) => m.roles?.cache.has(settings!.dj.role)).size > 0 &&
                    !message.member.roles?.cache.has(settings.dj.role) &&
                    !client.config.owners.includes(message.author.id)
                )
                    return errorResponse(`You need the <@&${settings.dj.role}> role to use this command while DJ only mode is enabled.`);
                if (checks[i] === 'owner' && !client.config.owners.includes(message.author.id))
                    return errorResponse("This command is restricted to Celerity's developers.");
            }
        }
        if (clientPermissions?.length) {
            const permissions = new PermissionsBitField(clientPermissions);
            if (!message.guild.members.me!.permissions.has(permissions))
                return client.respond(
                    message,
                    `${client.config.emojis.error} | **Celerity needs the following permission(s) to execute this command:**\n${permissions
                        .toArray()
                        .map((p) => `- \`${p.replace(/([A-Z])/g, ' $1').trim()}\``)
                        .join('\n')}`,
                    'error'
                );
        }
        if (userPermissions?.length) {
            const permissions = new PermissionsBitField(userPermissions);
            if (!message.member.permissions.has(permissions) && !client.config.owners.includes(message.author.id))
                return client.respond(
                    message,
                    `${client.config.emojis.error} | **You need the following permission(s) to use this command:**\n${permissions
                        .toArray()
                        .map((p) => `- \`${p.replace(/([A-Z])/g, ' $1').trim()}\``)
                        .join('\n')}`,
                    'error'
                );
        }
        if (command.options?.filter((o) => o.required).length && !args.length)
            return client.respond(
                message,
                `${client.config.emojis.error} | **Invalid usage.** Use \`${prefix}help ${command.name}\` for more information.`,
                'error'
            );

        try {
            command.execute({ client, context: message, args, settings, prefix, player, connection });
            const endTime = performance.now();
            const executionTime = endTime - startTime;
            client.logger.debug(`${message.author.username} (${message.author.id}) used command ${command.name}, executed in ${executionTime}ms`);
            client.statistics.commands.executed.push({ commandName: command.name, executionTime, user: message.author.id, guild: message.guild.id });
        } catch (err) {
            client.logger.error(`Error executing command ${command.name}:`);
            client.logger.error(err);
            client.respond(message, `${client.config.emojis.error} | **An unknown error occurred while executing this command.**`, 'error');
            client.statistics.commands.errored.push({ commandName: command.name, user: message.author.id, guild: message.guild.id, error: err });
        }

        function errorResponse(text: string) {
            client.respond(message, `${client.config.emojis.error} | **${text}**`, 'error');
        }
    }
};
