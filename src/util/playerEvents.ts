import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, EmbedBuilder } from 'discord.js';
import _ from 'lodash';
import type { CelerityPlayer } from './player';
import type { Celerity } from './client';
import { CelerityTrack } from './track.js';
import type { TrackExceptionEvent, TrackStuckEvent } from 'shoukaku';

export const start = async (player: CelerityPlayer, client: Celerity) => {
    if (!player.current) return;
    if (player.timeout) {
        client.logger.debug(`Cleared timeout for ${ player.guild.id }`);
        clearTimeout(player.timeout);
        player.timeout = null;
    }
    const settings = client.guildSettings.get(player.guild.id) || _.cloneDeep(client.config.defaultSettings);
    const row1 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('previous')
                .setLabel('Previous')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('⏮️'),
            new ButtonBuilder()
                .setCustomId('playback')
                .setLabel('Pause / Resume')
                .setStyle(ButtonStyle.Success)
                .setEmoji('⏯️'),
            new ButtonBuilder()
                .setCustomId('skip')
                .setLabel('Skip')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('⏭️'),
            new ButtonBuilder()
                .setCustomId('stop')
                .setLabel('Stop')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('⏹️')
        );
    const row2 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('rewind')
                .setLabel('Rewind')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('⏪'),
            new ButtonBuilder()
                .setCustomId('shuffle')
                .setLabel('Shuffle')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('🔀'),
            new ButtonBuilder()
                .setCustomId('loop')
                .setLabel('Loop')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('🔁'),
            new ButtonBuilder()
                .setCustomId('queue')
                .setLabel('Queue')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('📜'),
            new ButtonBuilder()
                .setCustomId('autoplay')
                .setLabel('Autoplay')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji(client.config.emojis.autoplay)
        );
    let sourceEmoji: string;
    if (!hasSourceEmoji(player.current.info.sourceName)) sourceEmoji = client.config.emojis.playing;
    else sourceEmoji = client.config.emojis.sources[player.current.info.sourceName];
    if (settings.announceNowPlaying) {
        if (player.loop === 'track') {
            if (player._notifiedOnce) return;
            else player._notifiedOnce = true;
        } else player._notifiedOnce = false;
        player.nowPlayingMessage = await player.channel.send({
            content: player.client.messageContent,
            embeds: [
                new EmbedBuilder()
                    .setDescription(`${ sourceEmoji } | **Now playing [${ player.current.info.title } by ${ player.current.info.author }](${ player.current.info.uri })** (${ player.current.info.requester.toString() })`)
                    .setColor(settings.color)
            ],
            components: settings.buttons !== 'off' ? (settings.buttons === 'extra' ? [ row1, row2 ] : [ row1 ]) : undefined
        });
    }
    if (player.guild.members.me!.voice.channel?.type === ChannelType.GuildStageVoice && settings.setStageTopic) {
        if (player.guild.members.me!.voice.channel.stageInstance === null) {
            player.guild.members.me!.voice.channel.createStageInstance({
                topic: truncate(`${ player.current.info.title } - ${ player.current.info.author }`, 110),
                sendStartNotification: false
            }).catch(() => null);
        } else {
            player.guild.members.me!.voice.channel.stageInstance.edit({ topic: truncate(`${ player.current.info.title } - ${ player.current.info.author }`, 110) }).catch(() => null);
        }
    }

    function hasSourceEmoji(value: string): value is keyof typeof client.config.emojis.sources {
        return value in client.config.emojis.sources;
    }

    function truncate(str: string, n: number) {
        return (str.length > n) ? str.slice(0, n - 1) + '...' : str;
    }
};

export const end = async (player: CelerityPlayer, client: Celerity) => {
    const settings = client.guildSettings.get(player.guild.id) || _.cloneDeep(client.config.defaultSettings);
    if (player.loop === 'track') player.queue.unshift(player.current!);
    if (player.loop === 'queue' && !player.previousUsed && player.current!.info.requester.id !== client.user!.id) player.queue.push(player.current!);
    if (!player.previousUsed) player.previous.unshift(player.current!);
    player.previousUsed = false;
    if (player.nowPlayingMessage && !player._notifiedOnce) {
        if (settings.cleanup) await player.nowPlayingMessage.delete().catch(() => null);
        else await player.nowPlayingMessage.edit({ components: [] }).catch(() => null);
        player.nowPlayingMessage = null;
    }
    if (!player.queue.length) {
        if (settings.disconnectTimeout === 0) return player.destroy();
        else if (settings.autoplay && !player.autoplayQueue.length && !player.stopped) {
            let identifier: string;
            if (player.current!.info.sourceName === 'youtube') identifier = player.current!.info.identifier;
            else {
                const res = await client.node.rest.resolve(`ytmsearch:${ player.current!.info.title } - ${ player.current!.info.author }`);
                if (!res || res.loadType !== 'search' || !res.data.length) {
                    settings.autoplay = false;
                    if (settings.disconnectTimeout === 0) return player.destroy();
                    client.util.timeout(player);
                    player.current = null;
                    return client.respond(player.channel, `${ client.config.emojis.error } | **Failed to autoplay.**\nFailed to resolve last track, automatically disabled autoplay.`, 'error');
                }
                const tracks = res.data;
                let finalTrack;
                for (let i = 0; i < tracks.length; i++) {
                    const playing = tracks[i]!;
                    if (
                        client.util.stringMatchPercentage(playing.info.title, player.current!.info.title) < 90 &&
                        client.util.stringMatchPercentage(playing.info.author.replace(' - Topic', '').trim(), player.current!.info.author) < 75 &&
                        client.util.stringMatchPercentage(`${ playing.info.title } - ${ playing.info.author.replace(' - Topic', '').trim() }`, `${ player.current!.info.title } - ${ player.current!.info.author }`) < 75
                    ) continue;
                    else {
                        finalTrack = playing;
                        break;
                    }
                }
                if (!finalTrack) {
                    settings.autoplay = false;
                    if (settings.disconnectTimeout === 0) return player.destroy();
                    client.util.timeout(player);
                    player.current = null;
                    return client.respond(player.channel, `${ client.config.emojis.error } | **Failed to autoplay.**\nFailed to resolve last track, automatically disabled autoplay.`, 'error');
                }
                identifier = finalTrack.info.identifier;
            }
            const similarTracks = await client.node.rest.resolve(`https://music.youtube.com/watch?v=${ identifier }&list=RD${ identifier }`);
            if (!similarTracks || similarTracks.loadType !== 'playlist' || !similarTracks.data.tracks.length) {
                settings.autoplay = false;
                if (settings.disconnectTimeout === 0) return player.destroy();
                client.util.timeout(player);
                player.current = null;
                return client.respond(player.channel, `${ client.config.emojis.error } | **Failed to autoplay.**\nNo similar tracks found, automatically disabled autoplay.`, 'error');
            }
            similarTracks.data.tracks.shift();
            player.autoplayQueue.push(...similarTracks.data.tracks.map(t => new CelerityTrack(t, player.guild.members.me!)));
            player.autoplay();
        } else if (settings.autoplay && player.autoplayQueue.length) return player.autoplay();
        else {
            if (player.guild.members.me!.voice.channel?.type === ChannelType.GuildStageVoice) {
                player.guild!.members.me!.voice.setSuppressed(true).catch(() => null);
                if (player.guild.members.me!.voice.channel.stageInstance != null && settings.setStageTopic) {
                    player.guild.members.me!.voice.channel.stageInstance.edit({ topic: 'Nothing playing' }).catch(() => null);
                }
            }
            client.util.timeout(player);
            return player.current = null;
        }
    } else return player.play();
};

export const stuck = async (player: CelerityPlayer, client: Celerity, err: TrackStuckEvent) => {
    client.logger.error(`Player in ${ player.guild.name } (${ player.guild.id }) encountered a playback error:`);
    client.logger.error(err);
    client.respond(player.channel, `${ client.config.emojis.error } | **Stuck while playing [${ player.current!.info.title } by ${ player.current!.info.author }](${ player.current!.info.uri }), skipping.**`, 'warn');
    player.play();
};

export const exception = async (player: CelerityPlayer, client: Celerity, err: TrackExceptionEvent) => {
    client.logger.error(`Player in ${ player.guild.name } (${ player.guild.id }) encountered a playback error:`);
    client.logger.error(err);
    client.respond(player.channel, `${ client.config.emojis.error } | **An error occurred while playing [${ player.current!.info.title } by ${ player.current!.info.author }](${ player.current!.info.uri }), skipping.**`, 'error');
    if (player.loop === 'track') player.setLoop('off');
    player.player.stopTrack().then();
};