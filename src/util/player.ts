import type { Client, TextBasedChannel, GuildMember, Guild, Message } from 'discord.js';
import type { Player, Node } from 'shoukaku';
import type { CelerityTrack } from './track';
import type { Celerity } from './client';
import { ChannelType } from 'discord.js';
import { start, end, stuck, exception } from './playerEvents.js';
import { Queue } from './queue.js';
import pms from 'pretty-ms';
import _ from 'lodash';

export class CelerityPlayer {
    constructor(client: Celerity, member: GuildMember, channel: TextBasedChannel, player: Player) {
        this.client = client;
        this.node = player.node;
        this.guild = member.guild;
        this.channel = channel;

        this.player = player;

        this.queue = new Queue();
        this.autoplayQueue = new Queue();
        this.previous = [];

        this.current = null;
        this.nowPlayingMessage = null;
        this.nowPlayingInterval = null;
        this.loop = 'off';
        this.stopped = false;
        this.previousUsed = false;
        this.playskipUsed = false;

        this.timeout = null;
        this.noUserTimeout = null;

        this.lastPlayerUpdate = Date.now();
        this.connected = true;

        this._notifiedOnce = false;

        player
            .on('start', () => start(this, client))
            .on('end', () => end(this, client))
            .on('stuck', (err) => stuck(this, client, err))
            .on('exception', (err) => exception(this, client, err))
            .on('update', ({ guildId, state }) => {
                if (guildId !== this.guild.id) return;
                this.connected = state.connected;
                this.lastPlayerUpdate = Date.now();
            });
    }

    handleTrack(track: CelerityTrack, next: boolean, playskip = false) {
        if (playskip) {
            if (this.loop === 'track') this.loop = 'off';
            this.queue.forEach((t) => (t.skipped = true));
            if (this.current) {
                this.current.skipped = true;
                this.previous.unshift(this.current);
                this.client.statistics.tracks.push({
                    skipped: this.current.skipped,
                    encoded: this.current.encoded,
                    identifier: this.current.info.identifier,
                    author: this.current.info.author,
                    length: this.current.info.length,
                    isStream: this.current.info.isStream,
                    title: this.current.info.title,
                    uri: this.current.info.uri,
                    sourceName: this.current.info.sourceName,
                    artworkUrl: this.current.info.artworkUrl,
                    isrc: this.current.info.isrc,
                    requester: this.current.info.requester.id,
                    guild: this.guild.id,
                });
            }
            const cleared = this.queue.clear();
            for (const t of cleared)
                this.client.statistics.tracks.push({
                    skipped: t.skipped,
                    encoded: t.encoded,
                    identifier: t.info.identifier,
                    author: t.info.author,
                    length: t.info.length,
                    isStream: t.info.isStream,
                    title: t.info.title,
                    uri: t.info.uri,
                    sourceName: t.info.sourceName,
                    artworkUrl: t.info.artworkUrl,
                    isrc: t.info.isrc,
                    requester: t.info.requester.id,
                    guild: this.guild.id,
                });
            this.previous.unshift(...cleared.reverse());
            this.queue.push(track);
            this.playskipUsed = true;
            this.player.stopTrack().then();
            return;
        }
        if (next) this.queue.unshift(track);
        else this.queue.push(track);
        if (!this.current) this.play();
        if (this.autoplayQueue.length) this.autoplayQueue.clear();
        return;
    }

    handlePlaylist(tracks: CelerityTrack[], next: boolean, playskip = false, shuffle = false) {
        if (shuffle) tracks = this.queue.shuffle(tracks);
        if (playskip) {
            if (this.loop === 'track') this.loop = 'off';
            this.queue.forEach((t) => (t.skipped = true));
            if (this.current) {
                this.current.skipped = true;
                this.previous.unshift(this.current);
                this.client.statistics.tracks.push({
                    skipped: this.current.skipped,
                    encoded: this.current.encoded,
                    identifier: this.current.info.identifier,
                    author: this.current.info.author,
                    length: this.current.info.length,
                    isStream: this.current.info.isStream,
                    title: this.current.info.title,
                    uri: this.current.info.uri,
                    sourceName: this.current.info.sourceName,
                    artworkUrl: this.current.info.artworkUrl,
                    isrc: this.current.info.isrc,
                    requester: this.current.info.requester.id,
                    guild: this.guild.id,
                });
            }
            const cleared = this.queue.clear();
            for (const t of cleared)
                this.client.statistics.tracks.push({
                    skipped: t.skipped,
                    encoded: t.encoded,
                    identifier: t.info.identifier,
                    author: t.info.author,
                    length: t.info.length,
                    isStream: t.info.isStream,
                    title: t.info.title,
                    uri: t.info.uri,
                    sourceName: t.info.sourceName,
                    artworkUrl: t.info.artworkUrl,
                    isrc: t.info.isrc,
                    requester: t.info.requester.id,
                    guild: this.guild.id,
                });
            this.previous.unshift(...cleared.reverse());
            this.queue.push(...tracks);
            this.playskipUsed = true;
            this.player.stopTrack().then();
            return;
        }
        if (next) this.queue.unshift(...tracks);
        else this.queue.push(...tracks);
        if (!this.current) this.play();
        if (this.autoplayQueue.length) this.autoplayQueue.clear();
        return;
    }

    play() {
        if (!this.queue.length) return;
        if (this.stopped) this.stopped = false;
        if (this.player.paused) this.player.setPaused(false);
        this.current = this.queue.shift()!;
        if (this.guild.members.me!.voice.channel?.type === ChannelType.GuildStageVoice) this.guild!.members.me!.voice.setSuppressed(false).catch(() => null);
        const defaultVolume = (this.client.guildSettings.get(this.guild.id)?.defaultVolume || this.client.config.defaultSettings.defaultVolume);
        return this.player.playTrack({ 
            track: this.current!.encoded,
            options: {
                volume: this.previous.length === 0 ? defaultVolume : this.player.volume !== defaultVolume ? this.player.volume : defaultVolume,
            }
        });
    }

    autoplay() {
        if (!this.autoplayQueue.length && this.queue.length) return this.play();
        else if (!this.autoplayQueue.length && !this.queue.length) return;
        if (this.stopped) this.stopped = false;
        this.current = this.autoplayQueue.shift()!;
        if (this.guild.members.me!.voice.channel?.type === ChannelType.GuildStageVoice) this.guild!.members.me!.voice.setSuppressed(false).catch(() => null);
        if (this.previous.map((t) => t.info.identifier).includes(this.current!.info.identifier)) {
            this.autoplay();
            return;
        }
        const defaultVolume = (this.client.guildSettings.get(this.guild.id)?.defaultVolume || this.client.config.defaultSettings.defaultVolume);
        return this.player.playTrack({ 
            track: this.current!.encoded,
            options: {
                volume: this.previous.length === 0 ? defaultVolume : this.player.volume !== defaultVolume ? this.player.volume : defaultVolume,
            }
        });
    }

    async destroy() {
        const settings = this.client.guildSettings.get(this.guild.id) || _.cloneDeep(this.client.config.defaultSettings);
        if (
            this.guild.members.me!.voice.channel?.type === ChannelType.GuildStageVoice &&
            this.guild.members.me!.voice.channel.stageInstance != null &&
            settings.setStageTopic
        ) {
            this.guild.members.me!.voice.channel.stageInstance.edit({ topic: 'Nothing playing' }).catch(() => null);
        }
        await this.client.shoukaku.leaveVoiceChannel(this.guild.id);
        if (this.nowPlayingMessage && settings.cleanup) this.nowPlayingMessage.delete().catch(() => null);
        clearInterval(this.nowPlayingInterval || undefined);
        this.client.players.delete(this.guild.id);
    }

    setLoop(type: 'off' | 'track' | 'queue') {
        this.loop = type;
        return this.loop;
    }

    ms(ms: number | undefined) {
        if (!ms) return '0:00';
        return pms(ms, { colonNotation: true, secondsDecimalDigits: 0 });
    }

    get position() {
        if (!this.current) return 0;
        if (this.player.paused || !this.connected) return this.player.position;
        return Math.min(this.player.position + (Date.now() - this.lastPlayerUpdate), this.current.info.length);
    }
}

export interface CelerityPlayer {
    client: Client;
    node: Node;
    player: Player;
    member: GuildMember;
    guild: Guild;
    channel: TextBasedChannel;
    queue: Queue;
    autoplayQueue: Queue;
    current: CelerityTrack | null;
    previous: CelerityTrack[];
    loop: 'off' | 'track' | 'queue';
    nowPlayingMessage: Message | null;
    nowPlayingInterval: NodeJS.Timeout | null;
    stopped: boolean;
    previousUsed: boolean;
    playskipUsed: boolean;
    timeout: NodeJS.Timeout | null;
    noUserTimeout: NodeJS.Timeout | null;
    lastPlayerUpdate: number;
    connected: boolean;
    _notifiedOnce: boolean;
}
