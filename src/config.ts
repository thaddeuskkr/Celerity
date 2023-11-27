import type { ActivityOptions, Client, PresenceStatusData } from 'discord.js';
import { ActivityType } from 'discord.js';
import type { GuildSettings } from './types';

export class Config {
    constructor(client: Client) {
        this.client = client;
    }

    logLevel: string = String(process.env.LOG_LEVEL) || 'info';

    // Credentials
    token: string = String(process.env.TOKEN) || '';
    database = {
        url: String(process.env.DATABASE_URL) || '',
        namespace: String(process.env.DATABASE_NAMESPACE) || ''
    };

    // Lavalink server
    lavalinkUrl: string = String(process.env.LAVALINK_URL) || '';
    lavalinkAuth: string = String(process.env.LAVALINK_AUTH) || '';
    lavalinkSecure: string = String(process.env.LAVALINK_SECURE) || '';

    // Owners
    owners: string[] = String(process.env.OWNERS).split(',') || [];

    // API tokens
    sp_dc: string = String(process.env.SP_DC) || '';
    topggToken: string = String(process.env.TOPGG) || '';

    // Client presence
    activities: ActivityOptions[] = [
        {
            name: 'music for you ♡',
            type: ActivityType.Playing,
        },
        {
            name: '{version} • c!help',
            type: ActivityType.Playing
        },
        {
            name: '{servercount} servers • c!help',
            type: ActivityType.Watching
        },
        {
            name: '{usercount} users • c!help',
            type: ActivityType.Watching
        }
    ];
    statuses: PresenceStatusData[] = [ 'idle', 'idle', 'idle', 'idle' ];
    presenceUpdateInterval = 25; // in seconds

    // Default per-server settings
    defaultSettings: GuildSettings = {
        announceConnect: true,
        announceDisconnect: true,
        announceNowPlaying: true,
        autoplay: false,
        banned: [],
        buttons: 'base',
        cleanup: true,
        color: '#CBA6F7',
        disabledChannels: [],
        disconnectTimeout: 300, // In seconds
        dj: {
            enabled: false,
            role: ''
        },
        prefixes: [ 'c!' ],
        searchProvider: 'ytmsearch',
        setStageTopic: true,
        statistics: true,
        voteSkip: false,
        voteSkipPercentage: 50
    };

    // Emojis
    emojis = {
        // Main
        error: '<a:red:1028261185918865408>',
        success: '<a:green:1009497462978924604>',
        playing: '<a:spinning:1062323792996737024>',
        loading: '<a:loading:1104805836649414716>',

        // Misc
        ping: '<:ping:1104805880211451965>',
        autoplay: '<:play:1105051545034297347>',
        timeout: '<:timeout:1104652485903261746>',
        queued: '<:plus:1104763529904529508>',
        clear: '💣',
        connect: '<:join:1104763777221677119>',
        disconnect: '<:leave:1104763853067260074>',
        loopOff: '<a:green:1009497462978924604>',
        loopQueue: '🔁',
        loopTrack: '🔂',
        move: '<a:green:1009497462978924604>',
        playskip: '⏭️',
        previous: '⏮️',
        remove: '💣',
        pause: '⏸️',
        resume: '▶️',
        rewind: '⏪',
        seek: '⏩',
        shuffle: '🔀',
        skip: '⏭️',
        stop: '⏹️',
        volume: '🔊',

        // Sources
        sources: {
            'youtube': '<:youtube:1104308197440888834>',
            'youtubemusic': '<:youtubemusic:1110375196973604954>',
            'spotify': '<:spotify:1104308093942251590>',
            'deezer': '<:deezer:1104308063780995082>',
            'soundcloud': '<:soundcloud:1104308078071001159>',
            'applemusic': '<:applemusic:1104308042515877928>',
            'yandexmusic': '<:yandexmusic:1104308117421948928>'
        },

        // Pagination
        nextPage: '<a:right_arrow:1106061122823524473>',
        prevPage: '<a:left_arrow:1106061156889677976>'
    };
}

export interface Config {
    client: Client;
}