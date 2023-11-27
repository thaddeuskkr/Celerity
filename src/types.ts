import type { Logger } from 'pino';
import type { Config } from './config';
import type { Util } from './util/util';
import type {
    ColorResolvable,
    EmbedBuilder,
    TextBasedChannel,
    Message,
    MessageCreateOptions
} from 'discord.js';
import type { Collection } from '@discordjs/collection';
import type { CelerityPlayer } from './util/player';
import type Keyv from 'keyv';
import type { Connection, Shoukaku } from 'shoukaku';
import type { Celerity } from './util/client';
import { ApplicationCommandOptionType, Attachment, Embed } from 'discord.js';

export type GuildSettings = {
    announceConnect: boolean,
    announceDisconnect: boolean,
    announceNowPlaying: boolean,
    autoplay: boolean,
    banned: string[],
    buttons: 'off' | 'base' | 'extra',
    cleanup: boolean,
    color: ColorResolvable,
    disabledChannels: string[],
    disconnectTimeout: number, // (Set to 0 to disconnect immediately)
    dj: {
        enabled: boolean,
        role: string,
    },
    prefixes: string[],
    searchProvider: 'ytmsearch' | 'ytsearch' | 'spsearch' | 'dzsearch' | 'scsearch' | 'amsearch' | 'ymsearch',
    setStageTopic: boolean,
    statistics: boolean,
    voteSkip: boolean,
    voteSkipPercentage: number
}

export type Respond = (channel: TextBasedChannel, text: string | EmbedBuilder, color: ColorResolvable | 'success' | 'error' | 'loading' | 'warn' | 'info' | 'none', options?: MessageCreateOptions) => void;

export type Command = {
    name: string;
    description: string;
    aliases?: string[];
    checks?: ('vc' | 'samevc' | 'joinable' | 'speakable' | 'player' | 'playing' | 'queue' | 'dj' | 'owner' | 'connection')[];
    userPermissions?: bigint[];
    clientPermissions?: bigint[];
    options?: {
        name: string;
        description: string;
        type: ApplicationCommandOptionType;
        required: boolean;
        choices?: { name: string; value: string }[];
    }[];
    category?: string;

    execute({ client, context, args, settings, prefix, player, connection }: {
        client: Celerity,
        context: Message,
        args: string[],
        settings: GuildSettings,
        prefix: string,
        player: CelerityPlayer,
        connection?: Connection
    }): void;
}

declare module 'discord.js' {
    interface Client {
        config: Config;
        util: Util;
        commands: Collection<string, Command>;
        players: Collection<string, CelerityPlayer>;
        logger: Logger;
        db: Keyv;
        shoukaku: Shoukaku;
        messageContent: string;
        spotify: {
            clientId: string;
            accessToken: string;
            accessTokenExpirationTimestampMs: number;
            isAnonymous: boolean;
        };
        guildSettings: Collection<string, GuildSettings>;
        presenceUpdater: {
            currentIndex: number;
            updateRequired: boolean;
        };
        respond: Respond;
    }
}

export type Snipe = {
    content: string;
    embeds: Embed[];
    attachments: Attachment[];
    channel: string;
    author: string;
    timestamp: number;
};

export type Event = {
    name: string;
    once: boolean;
    emitter: 'client' | 'player' | 'shoukaku' | 'db';
    run(client: Celerity, ...args: unknown[]): void;
}