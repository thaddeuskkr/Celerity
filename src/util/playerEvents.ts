import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, EmbedBuilder } from 'discord.js';
import _ from 'lodash';
import type { Track, TrackExceptionEvent, TrackStuckEvent } from 'shoukaku';
import type { Celerity } from './client';
import type { CelerityPlayer } from './player';
import { CelerityTrack } from './track.js';

export const start = async (player: CelerityPlayer, client: Celerity) => {
    if (!player.current) return;
    if (player.timeout) {
        client.logger.debug(`Cleared timeout for ${player.guild.id}`);
        clearTimeout(player.timeout);
        player.timeout = null;
    }
    const settings = client.guildSettings.get(player.guild.id) || _.cloneDeep(client.config.defaultSettings);
    const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId('previous').setLabel('Previous').setStyle(ButtonStyle.Primary).setEmoji('⏮️'),
        new ButtonBuilder().setCustomId('playback').setLabel('Pause / Resume').setStyle(ButtonStyle.Success).setEmoji('⏯️'),
        new ButtonBuilder().setCustomId('skip').setLabel('Skip').setStyle(ButtonStyle.Primary).setEmoji('⏭️'),
        new ButtonBuilder().setCustomId('stop').setLabel('Stop').setStyle(ButtonStyle.Danger).setEmoji('⏹️')
    );
    const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId('rewind').setLabel('Rewind').setStyle(ButtonStyle.Secondary).setEmoji('⏪'),
        new ButtonBuilder().setCustomId('shuffle').setLabel('Shuffle').setStyle(ButtonStyle.Secondary).setEmoji('🔀'),
        new ButtonBuilder().setCustomId('loop').setLabel('Loop').setStyle(ButtonStyle.Secondary).setEmoji('🔁'),
        new ButtonBuilder().setCustomId('queue').setLabel('Queue').setStyle(ButtonStyle.Secondary).setEmoji('📜'),
        new ButtonBuilder().setCustomId('autoplay').setLabel('Autoplay').setStyle(ButtonStyle.Secondary).setEmoji(client.config.emojis.autoplay)
    );
    let sourceEmoji: string;
    if (!hasSourceEmoji(player.current.info.sourceName)) sourceEmoji = client.config.emojis.playing;
    else sourceEmoji = client.config.emojis.sources[player.current.info.sourceName];
    if (settings.announceNowPlaying) {
        if (player.loop === 'track') {
            if (player._notifiedOnce) return;
            player._notifiedOnce = true;
        } else player._notifiedOnce = false;
        player.nowPlayingMessage = await player.channel.send({
            embeds: [
                new EmbedBuilder()
                    .setDescription(
                        `${sourceEmoji} | **Now playing [${player.current.info.title} by ${player.current.info.author}](${
                            player.current.info.uri
                        })** (${player.current.info.requester.toString()})`
                    )
                    .setColor(settings.color)
            ],
            components: settings.buttons !== 'off' ? (settings.buttons === 'extra' ? [row1, row2] : [row1]) : undefined
        });
    }
    if (player.guild.members.me!.voice.channel?.type === ChannelType.GuildStageVoice && settings.setStageTopic) {
        if (player.guild.members.me!.voice.channel.stageInstance === null) {
            player.guild.members
                .me!.voice.channel.createStageInstance({
                    topic: truncate(`${player.current.info.title} - ${player.current.info.author}`, 110),
                    sendStartNotification: false
                })
                .catch(() => null);
        } else {
            player.guild.members
                .me!.voice.channel.stageInstance.edit({ topic: truncate(`${player.current.info.title} - ${player.current.info.author}`, 110) })
                .catch(() => null);
        }
    }

    function hasSourceEmoji(value: string): value is keyof typeof client.config.emojis.sources {
        return value in client.config.emojis.sources;
    }

    function truncate(str: string, n: number) {
        return str.length > n ? `${str.slice(0, n - 1)}...` : str;
    }
};

export const end = async (player: CelerityPlayer, client: Celerity) => {
    if (!player.current) return;
    const settings = client.guildSettings.get(player.guild.id) || _.cloneDeep(client.config.defaultSettings);
    if (!player.previousUsed && !player.playskipUsed) player.previous.unshift(player.current);
    if (player.loop === 'track') player.queue.unshift(player.current);
    if (player.loop === 'queue' && !player.previousUsed && player.current.info.requester.id !== client.user!.id) player.queue.push(player.current);
    player.previousUsed = false;
    player.playskipUsed = false;
    if (player.nowPlayingMessage && !player._notifiedOnce) {
        if (settings.cleanup) await player.nowPlayingMessage.delete().catch(() => null);
        else await player.nowPlayingMessage.edit({ components: [] }).catch(() => null);
        player.nowPlayingMessage = null;
    }
    if (!player.queue.length) {
        if (settings.disconnectTimeout === 0) return player.destroy();
        if (settings.autoplay.enabled && !player.autoplayQueue.length && !player.stopped) {
            const trackIdentifiers: Array<string> = [];
            const usableTracks = player.previous.filter((t) =>
                t.info.title === 'Unknown title' && t.info.author === 'Unknown artist'
                    ? false
                    : !(
                          (t.skipped && t.info.requester.id === client.user!.id) // TODO: Can be changed to separate these conditions - might be better.
                      )
            );
            for (let n = 0; n < Math.min(usableTracks.length, 5); n++) {
                const t = usableTracks[n]!;
                if (t.info.sourceName === 'spotify') trackIdentifiers.push(t.info.identifier);
                else {
                    const res = await player.node.rest.resolve(`spsearch:${t.info.title} - ${t.info.author}`);
                    if (!res || res.loadType !== 'search' || !res.data.length) continue;
                    const tracks = res.data;
                    let finalTrack: Track | null = null;
                    for (let i = 0; i < tracks.length; i++) {
                        const playing = tracks[i]!;
                        if (
                            client.util.stringMatchPercentage(playing.info.title, t.info.title) < 90 &&
                            client.util.stringMatchPercentage(playing.info.author, t.info.author.replace(' - Topic', '').trim()) < 75 &&
                            client.util.stringMatchPercentage(
                                `${playing.info.title} - ${playing.info.author}`,
                                `${t.info.title} - ${t.info.author.replace(' - Topic', '').trim()}`
                            ) < 75
                        )
                            continue;

                        finalTrack = playing;
                        break;
                    }
                    if (!finalTrack) continue;
                    trackIdentifiers.push(finalTrack.info.identifier);
                }
            }
            if (!trackIdentifiers.length) {
                if (settings.disconnectTimeout === 0) return player.destroy();
                client.util.timeout(player);
                player.current = null;
                player.stopped = true;
                return client.respond(
                    player.channel,
                    `${client.config.emojis.error} | **Failed to autoplay.**\nFailed to retrieve information for previously played tracks.`,
                    'error'
                );
            }
            const similarTracks = await player.node.rest.resolve(
                `sprec:seed_tracks=${trackIdentifiers.join(',')}${
                    settings.autoplay.targetPopularity === -1 ? '' : `&target_popularity=${settings.autoplay.targetPopularity}`
                }${settings.autoplay.minimumPopularity === -1 ? '' : `&min_popularity=${settings.autoplay.minimumPopularity}`}${
                    settings.autoplay.maximumPopularity === -1 ? '' : `&max_popularity=${settings.autoplay.maximumPopularity}`
                }`
            );
            if (!similarTracks || similarTracks.loadType !== 'playlist' || !similarTracks.data.tracks.length) {
                if (settings.disconnectTimeout === 0) return player.destroy();
                client.util.timeout(player);
                player.current = null;
                player.stopped = true;
                return client.respond(player.channel, `${client.config.emojis.error} | **Failed to autoplay.**\nNo similar tracks found.`, 'error');
            }
            player.autoplayQueue.push(...similarTracks.data.tracks.map((t) => new CelerityTrack(t, player.guild.members.me!)));
            const newAutoplayQueue = _.cloneDeep(player.autoplayQueue.filter((val) => !usableTracks.includes(val)));
            player.autoplayQueue.clear();
            player.autoplayQueue.push(...newAutoplayQueue);
            player.autoplay();
        } else if (settings.autoplay.enabled && player.autoplayQueue.length && !player.stopped) return player.autoplay();
        else {
            if (player.guild.members.me!.voice.channel?.type === ChannelType.GuildStageVoice) {
                player.guild!.members.me!.voice.setSuppressed(true).catch(() => null);
                if (player.guild.members.me!.voice.channel.stageInstance != null && settings.setStageTopic) {
                    player.guild.members.me!.voice.channel.stageInstance.edit({ topic: 'Nothing playing' }).catch(() => null);
                }
            }
            client.util.timeout(player);
            player.stopped = true;
            player.current = null;
            return;
        }
    } else if (!player.stopped) return player.play();
};

export const stuck = (player: CelerityPlayer, client: Celerity, err: TrackStuckEvent) => {
    client.logger.error(`Player in ${player.guild.name} (${player.guild.id}) encountered a playback error:`);
    client.logger.error(err);
    if (!player.current) return;
    client.respond(
        player.channel,
        `${client.config.emojis.error} | **Stuck while playing [${player.current.info.title} by ${player.current.info.author}](${player.current.info.uri}), skipping.**`,
        'warn'
    );
    if (!player.stopped) player.play();
};

export const exception = (player: CelerityPlayer, client: Celerity, err: TrackExceptionEvent) => {
    client.logger.error(`Player in ${player.guild.name} (${player.guild.id}) encountered a playback error:`);
    client.logger.error(err);
    if (!player.current) return;
    client.respond(
        player.channel,
        `${client.config.emojis.error} | **An error occurred while playing [${player.current.info.title} by ${player.current.info.author}](${player.current.info.uri}), disconnecting to prevent further issues.**`,
        'error'
    );
    if (player.loop === 'track') player.setLoop('off');
    player.destroy();
};
