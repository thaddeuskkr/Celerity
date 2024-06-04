import type { GuildMember } from 'discord.js';
import type { Track } from 'shoukaku';

export class CelerityTrack {
    constructor(track: Track, requester: GuildMember, source?: string) {
        track.info.sourceName = source === 'ytmsearch' ? 'youtubemusic' : track.info.sourceName;
        track.info.author = track.info.author.replace(' - Topic', '');
        this.skipped = false;
        this.encoded = track.encoded;
        this.info = { ...track.info, requester };
    }
}

export interface CelerityTrack extends Track {
    skipped: boolean;
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
