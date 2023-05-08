import type { Event } from '../types';
import { ChannelType, type VoiceState } from 'discord.js';
import type { CelerityPlayer } from '../util/player';
import _ from 'lodash';

export const event: Event = {
    name: 'voiceStateUpdate',
    once: false,
    emitter: 'client',

    async run(client, o: VoiceState, n: VoiceState) {
        if (!o.guild || !n.guild) return;
        const player: CelerityPlayer | undefined = client.players.get(o?.guild.id) || client.players.get(n?.guild.id);
        const settings = client.guildSettings.get(o?.guild.id) || client.guildSettings.get(n?.guild.id) || _.cloneDeep(client.config.defaultSettings);
        if (o.member?.id === client.user!.id && n.member?.id === client.user!.id) {
            if (!n.channelId) { // Client disconnected from a voice channel
                if (player) player.destroy();
                return;
            }
            if (o.channelId !== n.channelId && o.channelId && n.channelId) { // Client moved between voice channels
                if (n.channel?.type === ChannelType.GuildStageVoice && player) {
                    client.util.removeSuppress(n.channel);
                    if (n.channel.stageInstance === null) {
                        if (!settings.setStageTopic) return;
                        if (!player.current) return;
                        n.channel.createStageInstance({
                            topic: truncate(`${ player.current.info.title } - ${ player.current.info.author }`, 110),
                            sendStartNotification: false
                        }).catch(() => null);
                    } else {
                        if (!settings.setStageTopic) return;
                        if (!player.current) return n.channel.stageInstance.edit({ topic: 'Nothing playing' }).catch(() => null);
                        n.channel.stageInstance.edit({ topic: truncate(`${ player.current.info.title } - ${ player.current.info.author }`, 110) }).catch(() => null);
                    }
                }
            }
        } else if (o.channelId !== n.channelId && player && o.guild.members.me!.voice.channel!.id === o.channelId) {
            if (player.noUserTimeout) {
                client.logger.debug(`Cleared no user timeout for ${ player.guild.id }`);
                clearTimeout(player.noUserTimeout);
                player.noUserTimeout = null;
            }
            client.logger.debug(`Started no user timeout for ${ player.guild.id }`);
            player.noUserTimeout = setTimeout(() => {
                const voiceChannel = player.guild.members.me?.voice.channel;
                if (!voiceChannel) {
                    if (player) {
                        clearTimeout(player.noUserTimeout!);
                        player.destroy();
                    }
                    return;
                }
                if (voiceChannel?.members.size <= 1) {
                    if (settings.announceDisconnect) client.respond(player.channel, client.config.emojis.timeout + ' | **Disconnected due to inactivity.**\nNo users in voice channel.', 'warn');
                    clearTimeout(player.noUserTimeout!);
                    player.destroy();
                    return;
                }
            }, settings.disconnectTimeout * 1000);
        } else if (o.channelId !== n.channelId && player && n.guild.members.me!.voice.channel!.id === n.channelId) {
            if (player.noUserTimeout) {
                client.logger.debug(`Cleared no user timeout for ${ player.guild.id }`);
                clearTimeout(player.noUserTimeout);
                player.noUserTimeout = null;
            }
        }
        return;

        function truncate(str: string, n: number) {
            return (str.length > n) ? str.slice(0, n - 1) + '...' : str;
        }
    }
};