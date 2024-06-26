import type { ActivityOptions, Client, PresenceStatusData } from 'discord.js';
import { ActivityType } from 'discord.js';
import type { GuildSettings, Maintenance, Statistics } from './types';

export class Config {
    constructor(client: Client) {
        this.client = client;
    }

    logLevel: string = String(process.env.LOG_LEVEL);
    logLavalinkUpdates: string = String(process.env.LOG_LAVALINK_UPDATES);

    // Credentials
    token: string = String(process.env.TOKEN);
    database = {
        url: String(process.env.DATABASE_URL),
        namespace: String(process.env.DATABASE_NAMESPACE)
    };

    // Lavalink server
    lavalink: { name: string; host: string; port: number; auth: string; secure: string } = {
        name: 'main',
        host: String(process.env.LAVALINK_HOST),
        port: Number(process.env.LAVALINK_PORT),
        auth: String(process.env.LAVALINK_AUTH),
        secure: String(process.env.LAVALINK_SECURE)
    };

    // Owners
    owners: string[] = String(process.env.OWNERS).split(',');

    // API tokens
    sp_dc: string = String(process.env.SP_DC);
    topggToken: string = String(process.env.TOPGG);

    // Webhooks
    webhookUrl: string = String(process.env.WEBHOOK_URL);

    // Client presence
    activities: ActivityOptions[] = [
        {
            name: 'music for you ♡',
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
    statuses: PresenceStatusData[] = ['idle', 'idle', 'idle'];
    presenceUpdateInterval = 20; // in seconds

    // Default per-server settings
    defaultSettings: GuildSettings = {
        announceConnect: true,
        announceDisconnect: true,
        announceNowPlaying: true,
        autoplay: {
            enabled: false,
            targetPopularity: -1,
            minimumPopularity: -1,
            maximumPopularity: -1
        },
        banned: [],
        buttons: 'base',
        cleanup: true,
        color: '#CBA6F7',
        defaultVolume: 60,
        disabledChannels: [],
        disconnectTimeout: 300, // In seconds
        dj: {
            enabled: false,
            role: ''
        },
        prefixes: ['c!'],
        searchProvider: 'ytmsearch',
        setStageTopic: true,
        voteSkip: false,
        voteSkipPercentage: 50
    };

    // Statistics - base object
    baseStatistics: Statistics = {
        commands: {
            executed: [],
            errored: []
        }
    };

    // Maintenance status - base object
    baseMaintenance: Maintenance = {
        active: false,
        message: ''
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
            youtube: '<:youtube:1104308197440888834>',
            youtubemusic: '<:youtubemusic:1110375196973604954>',
            spotify: '<:spotify:1104308093942251590>',
            deezer: '<:deezer:1219271122043011072>',
            soundcloud: '<:soundcloud:1104308078071001159>',
            applemusic: '<:applemusic:1104308042515877928>',
            yandexmusic: '<:yandexmusic:1104308117421948928>'
        },

        // Pagination
        nextPage: '<a:right_arrow:1106061122823524473>',
        prevPage: '<a:left_arrow:1106061156889677976>'
    };
}

export interface Config {
    client: Client;
}
