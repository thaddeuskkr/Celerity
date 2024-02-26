import { ActivityType, Client, EmbedBuilder, GatewayIntentBits } from 'discord.js';
import { Collection } from '@discordjs/collection';
import { Connectors, Shoukaku } from 'shoukaku';
import { Config } from '../config.js';
import { Util } from './util.js';
import pino from 'pino';
import Keyv from 'keyv';
import fs from 'fs';
import path from 'path';
import EventEmitter from 'events';
import type { Command, Event } from '../types';

export class Celerity extends Client {
    constructor() {
        super({
            intents: [
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildVoiceStates,
                GatewayIntentBits.Guilds,
                /* ============== Privileged intents ============== */
                GatewayIntentBits.GuildPresences,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.MessageContent,
            ],
            shards: 'auto',
            presence: {
                activities: [
                    {
                        name: 'starting...',
                        type: ActivityType.Playing,
                    },
                ],
                status: 'online',
            },
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
                          options: { colorize: true },
                      },
        });
        this.db = new Keyv(this.config.database.url, { namespace: this.config.database.namespace });
        this.shoukaku = new Shoukaku(
            new Connectors.DiscordJS(this),
            [
                {
                    name: this.config.lavalink.name,
                    url: `${this.config.lavalink.host}:${this.config.lavalink.port}`,
                    auth: this.config.lavalink.auth,
                    secure: this.config.lavalink.secure === 'true',
                },
            ],
            {
                userAgent: 'Celerity',
                reconnectTries: 9999,
                reconnectInterval: 10, // Tries to reconnect every 10 seconds, 9999 times.
            },
        );
        this.messageContent = '';
        this.presenceUpdater = {
            currentIndex: 0,
            updateRequired: true,
        };
        this.respond = (context, text, color, options) => {
            if (color === 'success') color = '#A6E3A1';
            else if (color === 'error') color = '#F38BA8';
            else if (color === 'loading') color = '#F5C2E7';
            else if (color === 'warn') color = '#F9E2AF';
            else if (color === 'info') color = '#CBA6F7';
            if (text instanceof EmbedBuilder) {
                if (color !== 'none') text.setColor(color);
                if ('reply' in context) context.reply({ content: this.messageContent, embeds: [text], allowedMentions: { repliedUser: false }, ...options });
                else context.send({ content: this.messageContent, embeds: [text], allowedMentions: { repliedUser: false }, ...options });
                return;
            } else {
                if (color === 'none') color = '#11111B';
                if ('reply' in context) context.reply({ content: this.messageContent, embeds: [new EmbedBuilder().setDescription(text).setColor(color)], allowedMentions: { repliedUser: false }, ...options });
                else context.send({
                    content: this.messageContent,
                    embeds: [new EmbedBuilder().setDescription(text).setColor(color)],
                    allowedMentions: { repliedUser: false },
                    ...options,
                });
            }
        };
    }

    async initialiseEvents(dirname: string) {
        const events = fs.readdirSync(path.join(dirname, 'events')).filter((file) => file.endsWith('.js'));

        for (const file of events) {
            const { event }: { event: Event } = await import('file:///' + path.join(dirname, 'events', file));
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
                    command,
                }: {
                    command: Command;
                } = await import('file:///' + path.join(dirname, 'commands', category, file));
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
