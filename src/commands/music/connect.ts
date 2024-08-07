import { ChannelType, type GuildMember, PermissionFlagsBits } from 'discord.js';
import type { Command } from '../../types';
import { CelerityPlayer } from '../../util/player.js';

export const command: Command = {
    name: 'connect',
    description: 'Creates a new player and has Celerity join your voice channel.',
    aliases: ['join', 'new', 'bind'],
    examples: ['{p}connect'],
    checks: ['vc', 'joinable', 'speakable', 'dj'],
    options: [],

    async execute({ client, context, player, settings, connection }) {
        if (!player || !connection) {
            try {
                const newPlayer = await client.shoukaku.joinVoiceChannel({
                    guildId: context.guild!.id,
                    channelId: context.member!.voice.channel!.id,
                    shardId: context.guild!.shardId,
                    deaf: true
                });
                client.respond(
                    context,
                    `${client.config.emojis.connect} | **Joined <#${context.member!.voice.channel!.id}> and bound to <#${context.channel.id}>.**`,
                    'success'
                );
                player = new CelerityPlayer(client, context.member!, context.channel!, newPlayer);
                client.players.set(context.guild!.id, player);
                player.stopped = true;
                client.util.timeout(player);
            } catch (err) {
                client.respond(context, `${client.config.emojis.error} | **Failed to connect to <#${context.member!.voice.channel!.id}>.**`, 'error');
                client.logger.error(`Failed to connect to voice channel ${context.member!.voice.channel!.id} in ${context.guild!.name} (${context.guild!.id})`);
                client.logger.error(err);
                return;
            }
        } else {
            const voiceChannel = context.guild!.channels.cache.get(connection.channelId!)!;
            if (voiceChannel.type !== ChannelType.GuildVoice && voiceChannel.type !== ChannelType.GuildStageVoice) {
                client.logger.error(
                    `Disconnected from ${voiceChannel.name} (${voiceChannel.id}) in ${context.guild!.name} (${
                        context.guild!.id
                    }) due to an unknown channel type: ${voiceChannel.type}`
                );
                return client.respond(context, `${client.config.emojis.error} | **Disconnected due to an internal error.**`, 'error');
            }
            const members = voiceChannel.members.filter((m: GuildMember) => !m.user.bot && !m.voice.deaf);
            if (
                members.size > 0 &&
                player.current &&
                !context.member!.permissions.has(PermissionFlagsBits.ModerateMembers) &&
                settings.dj.role &&
                !context.member!.roles?.cache.has(settings.dj.role)
            )
                return client.respond(
                    context,
                    `${client.config.emojis.error} | **You don't have permission to do that.**\nCelerity is playing music in another channel with users connected and undeafened. You will need the 'Moderate Members' permission to forcefully move Celerity to your channel.`,
                    'error'
                );

            if (context.member!.voice.channelId === context.guild!.members.me!.voice.channelId) {
                player.channel = context.channel;
                return client.respond(context, `${client.config.emojis.connect} | **Bound to <#${context.channel.id}>.**`, 'success');
            }
            if (player.channel.id === context.channel.id) {
                connection.channelId = context.member!.voice.channel!.id;
                connection.state = State.DISCONNECTED;
                await connection.connect();
                return client.respond(context, `${client.config.emojis.connect} | **Moved to <#${context.member!.voice.channel!.id}>.**`, 'success');
            }
            connection.channelId = context.member!.voice.channel!.id;
            connection.state = State.DISCONNECTED;
            await connection.connect();
            player.channel = context.channel;
            return client.respond(
                context,
                `${client.config.emojis.connect} | **Moved to <#${context.member!.voice.channel!.id}> and bound to <#${context.channel.id}>.**`,
                'success'
            );
        }
    }
};

enum State {
    CONNECTING = 0,
    NEARLY = 1,
    CONNECTED = 2,
    RECONNECTING = 3,
    DISCONNECTING = 4,
    DISCONNECTED = 5
}
