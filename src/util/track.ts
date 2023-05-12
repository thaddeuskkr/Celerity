import type { Track } from 'shoukaku';
import type { GuildMember } from 'discord.js';

export class CelerityTrack {
    constructor(track: Track, requester: GuildMember) {
        this.encoded = track.encoded;
        this.info = { ...track.info, requester };
    }
}

export interface CelerityTrack extends Track {
    info: {
        identifier: string;
        isSeekable: boolean;
        author: string;
        length: number;
        isStream: boolean;
        position: number;
        title: string;
        uri?: string;
        artworkUrl?: string;
        isrc?: string;
        sourceName: string;
        requester: GuildMember;
    };
}