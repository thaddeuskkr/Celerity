import type { Command } from '../../types';
import { ChannelType, GuildMember } from 'discord.js';

export const command: Command = {
    name: 'disconnect',
    description: 'Stops the player and disconnects Celerity.',
    aliases: [ 'dc', 'fuckoff', 'leave' ],
    checks: [ 'vc', 'dj', 'player' ],
    options: [],

    async execute({ client, context, player }) {
        const voiceChannel = context.guild!.channels.cache.get(player.player.connection.channelId!)!;
        if (voiceChannel.type !== ChannelType.GuildVoice && voiceChannel.type !== ChannelType.GuildStageVoice) {
            client.logger.error(`Disconnected from ${ voiceChannel.name } (${ voiceChannel.id }) in ${ context.guild!.name } (${ context.guild!.id }) due to an unknown channel type: ${ voiceChannel.type }`);
            return client.respond(context.channel, `${ client.config.emojis.error } | **Disconnected due to an internal error.**`, 'error');
        }
        const members = voiceChannel.members.filter((m: GuildMember) => !m.user.bot && !m.voice.deaf);
        if (members.size > 0 && player.current && context.member!.voice.channelId !== context.guild!.members.me!.voice.channelId)
            return client.respond(context.channel, `${ client.config.emojis.error } | **You're not in <#${ context.guild!.members.me!.voice.channel!.id }>.**`, 'error');
        client.respond(context.channel, `${ client.config.emojis.disconnect } | **Disconnected from <#${ player.player.connection.channelId }>.**`, 'success');
        player.player.connection.disconnect().then();
        player.destroy();
        return;
    }
};