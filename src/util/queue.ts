import type { CelerityTrack } from './track';

export class Queue extends Array<CelerityTrack> {
    constructor() {
        super();
    }

    move(oldPosition: number, newPosition: number): CelerityTrack {
        const track = this.splice(oldPosition, 1)[0]!;
        this.splice(newPosition, 0, track);
        return track;
    }

    remove(index: number): CelerityTrack | undefined {
        return this.splice(index, 1)[0];
    }

    clear() {
        return this.splice(0);
    }

    shuffle(tracks: Queue | CelerityTrack[] = this): Queue | CelerityTrack[] {
        if (tracks.length <= 1) return tracks;
        for (let i = tracks.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [ tracks[i], tracks[j] ] = [ tracks[j]!, tracks[i]! ];
        }
        return tracks;
    }

    get totalDuration(): number {
        if (this.find(track => track.info.isStream)) return Infinity;
        return this.reduce((acc, cur) => acc + cur.info.length, 0);
    }
}