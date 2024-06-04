import type EventEmitter from 'node:events';
import fs from 'node:fs';
import path from 'node:path';
import { Collection } from '@discordjs/collection';
import { ActivityType, Client, type ColorResolvable, EmbedBuilder, GatewayIntentBits } from 'discord.js';
import Keyv from 'keyv';
import pino from 'pino';
import { Connectors, Shoukaku } from 'shoukaku';
import { Config } from '../config.js';
import type { Command, Event } from '../types';
import { Util } from './util.js';

export class Celerity extends Client {
    constructor() {
        super({
            intents: [
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildVoiceStates,
                GatewayIntentBits.Guilds,
                /* ============== Privileged intents ============== */
                // GatewayIntentBits.GuildPresences,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.MessageContent
            ],
            shards: 'auto',
            presence: {
                activities: [
                    {
                        name: 'starting...',
                        type: ActivityType.Playing
                    }
                ],
                status: 'online'
            }
        });
        this.ready = false;
        this.config = new Config(this);
        this.util = new Util(this);
        this.commands = new Collection();
        this.players = new Collection();
        this.logger = pino({
            level: this.config.logLevel,
            transport:
                process.env.NODE_ENV === 'production'
                    ? undefined
                    : {
                          target: 'pino-pretty',
                          options: { colorize: true }
                      }
        });
        this.db = new Keyv(this.config.database.url, { namespace: this.config.database.namespace });
        this.shoukaku = new Shoukaku(
            new Connectors.DiscordJS(this),
            [
                {
                    name: this.config.lavalink.name,
                    url: `${this.config.lavalink.host}:${this.config.lavalink.port}`,
                    auth: this.config.lavalink.auth,
                    secure: this.config.lavalink.secure === 'true'
                }
            ],
            {
                userAgent: 'Celerity',
                reconnectTries: 9999,
                reconnectInterval: 10 // Tries to reconnect every 10 seconds, 9999 times.
            }
        );
        this.presenceUpdater = {
            currentIndex: 0,
            updateRequired: true
        };
        this.respond = (context, text, color, options) => {
            let hex: ColorResolvable = '#11111B';
            if (color === 'success') hex = '#A6E3A1';
            else if (color === 'error') hex = '#F38BA8';
            else if (color === 'loading') hex = '#F5C2E7';
            else if (color === 'warn') hex = '#F9E2AF';
            else if (color === 'info') hex = '#CBA6F7';
            if (text instanceof EmbedBuilder) {
                if (color !== 'none') text.setColor(hex);
                if ('reply' in context)
                    context.reply({
                        embeds: [text],
                        allowedMentions: { repliedUser: false },
                        ...options
                    });
                else
                    context.send({
                        embeds: [text],
                        allowedMentions: { repliedUser: false },
                        ...options
                    });
                return;
            }
            if (color === 'none') hex = '#11111B';
            if ('reply' in context)
                context.reply({
                    embeds: [new EmbedBuilder().setDescription(text).setColor(hex)],
                    allowedMentions: { repliedUser: false },
                    ...options
                });
            else
                context.send({
                    embeds: [new EmbedBuilder().setDescription(text).setColor(hex)],
                    allowedMentions: { repliedUser: false },
                    ...options
                });
        };
    }

    async initialiseEvents(dirname: string) {
        const events = fs.readdirSync(path.join(dirname, 'events')).filter((file) => file.endsWith('.js'));

        for (const file of events) {
            const { event }: { event: Event } = await import(`file:///${path.join(dirname, 'events', file)}`);
            const { name, emitter, once = false, run } = event;
            let eventEmitter: EventEmitter;
            switch (emitter) {
                case 'client':
                    eventEmitter = this;
                    break;
                case 'shoukaku':
                    eventEmitter = this.shoukaku;
                    break;
                case 'db':
                    eventEmitter = this.db;
                    break;
                default:
                    this.logger.warn(`Not loading ${file} due to an invalid emitter`);
                    continue;
            }
            if (once) eventEmitter.once(name, run.bind(null, this));
            else eventEmitter.on(name, run.bind(null, this));
        }
    }

    async initialiseCommands(dirname: string) {
        const categories = fs
            .readdirSync(path.join(dirname, 'commands'), { withFileTypes: true })
            .filter((dirent) => dirent.isDirectory())
            .map((dirent) => dirent.name);
        for (const category of categories) {
            const commands = fs.readdirSync(path.join(dirname, 'commands', category)).filter((file) => file.endsWith('.js'));
            for (const file of commands) {
                const {
                    command
                }: {
                    command: Command;
                } = await import(`file:///${path.join(dirname, 'commands', category, file)}`);
                if (!command || !command.name || !command.execute) {
                    this.logger.warn(`Not loading ${category}/${file} due to missing fields`);
                    continue;
                }
                command.category = category;
                this.commands.set(command.name, command);
            }
        }
    }

    async initialise(dirname: string) {
        await this.initialiseEvents(dirname);
        await this.initialiseCommands(dirname);
        await this.login(this.config.token);
    }
}
