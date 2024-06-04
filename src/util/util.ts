import axios from 'axios';
import type { TextBasedChannel } from 'discord.js';
import _ from 'lodash';
import type { Celerity } from './client';
import type { CelerityPlayer } from './player.js';

export class Util {
    constructor(client: Celerity) {
        this.client = client;
        this.eval = {
            lastEvalResult: '',
            hrStart: [0, 0],
            _sensitivePattern: null
        };
    }

    fullSourceNames = {
        youtube: 'YouTube',
        youtubemusic: 'YouTube Music',
        spotify: 'Spotify',
        deezer: 'Deezer',
        soundcloud: 'SoundCloud',
        applemusic: 'Apple Music',
        yandexmusic: 'Yandex Music'
    };

    splitBySpacesWithQuotes(str: string): string[] {
        const regex = /[^\s"]+|"([^"]*)"/gi;
        const result = [];
        let match: RegExpExecArray | null;

        do {
            match = regex.exec(str);
            if (match !== null) {
                result.push(match[1] ? match[1] : match[0]);
            }
        } while (match !== null);

        return result;
    }

    timeout(celerity: CelerityPlayer) {
        if (celerity.timeout !== null) {
            this.client.logger.debug(`Cleared timeout for ${celerity.guild.id}`);
            clearTimeout(celerity.timeout);
            celerity.timeout = null;
        }
        this.client.logger.debug(`Started timeout for ${celerity.guild.id}.`);
        celerity.timeout = setTimeout(
            () => {
                const player = this.client.players.get(celerity.guild.id);
                const settings = this.client.guildSettings.get(celerity.guild.id) || _.cloneDeep(this.client.config.defaultSettings);
                if (!player) return;
                if (player.timeout) clearTimeout(player.timeout);
                if (!player.queue.length && !player.current) {
                    if (settings.announceDisconnect)
                        this.client.respond(player.channel, `${this.client.config.emojis.timeout} | **Disconnected due to inactivity.**`, 'warn');
                    return player.destroy();
                }
                return;
            },
            (this.client.guildSettings.get(celerity.guild.id)?.disconnectTimeout || _.cloneDeep(this.client.config.defaultSettings).disconnectTimeout) * 1000
        );
    }

    removeSuppress(channel: TextBasedChannel) {
        if (channel.isDMBased()) return;
        channel.guild.members.me!.voice.setSuppressed(false).catch((err) => {
            this.client.logger.warn(`Failed to unmute Celerity in stage channel ${channel.guild!.members.me!.voice.channel?.id}`);
            this.client.logger.warn(err);
            this.client.respond(
                channel,
                `${this.client.config.emojis.error} | **Failed to speak on stage.**\nCelerity needs to be a \`Stage Moderator\` or have the \`Administrator\` permission to automatically move itself to the stage.\nAlternatively, invite Celerity to speak (\`Invite to Speak\`).`,
                'warn'
            );
        });
    }

    escapeBackticks(text: string | undefined) {
        if (!text) return text;
        return text.replaceAll('`', '\\`');
    }

    stringMatchPercentage(str1: string, str2: string) {
        let string1 = str1;
        let string2 = str2;
        // Convert both strings to lowercase to ensure a case-insensitive comparison & remove special characters
        const regex = /[-[\]{}()*+?.,\\^$|#\s]/g;
        string1 = string1.toLowerCase().replace(regex, '');
        string2 = string2.toLowerCase().replace(regex, '');

        // Calculate the edit distance between the two strings using the Levenshtein distance algorithm
        const matrix = [];
        const len1 = string1.length;
        const len2 = string2.length;
        for (let i = 0; i <= len1; i++) {
            matrix[i] = [i];
            for (let j = 1; j <= len2; j++) {
                matrix[i]![j] =
                    i === 0
                        ? j
                        : Math.min(
                              matrix[i - 1]![j - 1]! + (string1.charAt(i - 1) === string2.charAt(j - 1) ? 0 : 1),
                              Math.min(matrix[i]![j - 1]! + 1, matrix[i - 1]![j]! + 1)
                          );
            }
        }

        // Calculate the percentage match using the formula: 100 * (1 - (edit distance / length of longer string))
        const editDistance = matrix[len1]![len2];
        const maxLength = Math.max(len1, len2);
        return Math.round(100 * (1 - editDistance! / maxLength));
    }

    refreshSpotifyToken() {
        axios({
            method: 'get',
            url: 'https://open.spotify.com/get_access_token?reason=transport&productType=web_player',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36',
                'App-platform': 'WebPlayer',
                'Content-Type': 'text/html; charset=utf-8',
                cookie: `sp_dc=${this.client.config.sp_dc}`
            },
            timeout: 5000
        })
            .then((res) => {
                if (typeof res.data !== 'object' || Array.isArray(res.data) || res.data === null || res.data.isAnonymous)
                    this.client.logger.error('Failed to refresh Spotify access token.');
                this.client.spotify = res.data;
                this.client.logger.debug('Successfully refreshed Spotify access token.');
            })
            .catch((err) => {
                this.client.logger.error(`Failed to refresh Spotify access token. ${err}`);
            });
    }

    get sensitivePattern() {
        if (!this.eval._sensitivePattern) {
            const client = this.client;
            let pattern = '';
            if (client.token) pattern += this.escapeRegex(client.token);
            this.eval._sensitivePattern = new RegExp(pattern, 'gi');
        }
        return this.eval._sensitivePattern;
    }

    private escapeRegex(str: string) {
        return str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
    }
}

export interface Util {
    client: Celerity;
    eval: {
        lastEvalResult: string;
        hrStart: [number, number];
        _sensitivePattern: RegExp | null;
    };
}
