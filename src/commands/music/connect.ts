import type { Command } from '../../types';
import { CelerityPlayer } from '../../util/player.js';
import { ChannelType, GuildMember, PermissionFlagsBits } from 'discord.js';

export const command: Command = {
    name: 'connect',
    description: 'Creates a new player and has Celerity join your voice channel.',
    aliases: [ 'join', 'new', 'bind' ],
    checks: [ 'vc', 'joinable', 'speakable', 'dj' ],
    options: [],

    async execute({ client, context, player, settings }) {
        if (!player) {
            try {
                const newPlayer = await client.shoukaku.joinVoiceChannel({
                    guildId: context.guild!.id,
                    channelId: context.member!.voice.channel!.id,
                    shardId: context.guild!.shardId
                });
                if (settings.announceConnect) client.respond(context.channel, `${ client.config.emojis.connect } | **Joined <#${ context.member!.voice.channel!.id }> and bound to <#${ context.channel.id }>.**`, 'success');
                player = new CelerityPlayer(client, context.member!, context.channel!, newPlayer);
                client.players.set(context.guild!.id, player);
            } catch (err) {
                client.respond(context.channel, `${ client.config.emojis.error } | **Failed to connect to <#${ context.member!.voice.channel!.id }>.**`, 'error');
                client.logger.error(`Failed to connect to voice channel ${ context.member!.voice.channel!.id } in ${ context.guild!.name } (${ context.guild!.id })`);
                client.logger.error(err);
                return;
            }
            if (context.guild!.members.me!.voice.channel?.type === ChannelType.GuildStageVoice) client.util.removeSuppress(context.channel);
        } else {
            const voiceChannel = context.guild!.channels.cache.get(player.connection.channelId!)!;
            if (voiceChannel.type !== ChannelType.GuildVoice && voiceChannel.type !== ChannelType.GuildStageVoice) {
                client.logger.error(`Disconnected from ${ voiceChannel.name } (${ voiceChannel.id }) in ${ context.guild!.name } (${ context.guild!.id }) due to an unknown channel type: ${ voiceChannel.type }`);
                return client.respond(context.channel, `${ client.config.emojis.error } | **Disconnected due to an internal error.**`, 'error');
            }
            const members = voiceChannel.members.filter((m: GuildMember) => !m.user.bot && !m.voice.deaf);
            if (members.size > 0 && player.current && (!context.member!.permissions.has(PermissionFlagsBits.ModerateMembers) && (settings.dj.role && !context.member!.roles.cache.has(settings.dj.role))))
                return client.respond(context.channel, `${ client.config.emojis.error } | **You don't have permission to do that.**\nCelerity is playing music in another channel with users connected and undeafened. You will need the 'Moderate Members' permission to forcefully move Celerity to your channel.`, 'error');
            else {
                if (context.member!.voice.channelId === context.guild!.members.me!.voice.channelId) {
                    if (context.guild!.members.me!.voice.channel?.type === ChannelType.GuildStageVoice) client.util.removeSuppress(context.channel);
                    player.channel = context.channel;
                    return client.respond(context.channel, `${ client.config.emojis.connect } | **Bound to <#${ context.channel.id }>.**`, 'success');
                } else {
                    player.connection.channelId = context.member!.voice.channel!.id;
                    await player.connection.connect();
                    player.channel = context.channel;
                    return client.respond(context.channel, `${ client.config.emojis.connect } | **Moved to <#${ context.member!.voice.channel!.id }> and bound to <#${ context.channel.id }>.**`, 'success');
                }
            }
        }
    }
};
