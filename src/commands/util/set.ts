import {
    ActionRowBuilder,
    ApplicationCommandOptionType,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    MentionableSelectMenuBuilder,
    MessageComponentInteraction,
    StringSelectMenuBuilder,
    StringSelectMenuInteraction,
    StringSelectMenuOptionBuilder,
    UserSelectMenuInteraction,
    Message,
    type ColorResolvable,
    ChannelSelectMenuBuilder,
    ChannelSelectMenuInteraction,
    RoleSelectMenuBuilder,
    RoleSelectMenuInteraction,
    PermissionFlagsBits,
} from 'discord.js';
import type { Command } from '../../types';
import tags from 'common-tags';

export const command: Command = {
    name: 'set',
    description: 'Modification of server settings.',
    aliases: ['settings'],
    checks: [],
    userPermissions: [PermissionFlagsBits.ManageGuild, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ManageMessages],
    options: [
        {
            name: 'setting',
            description: 'The setting to modify.',
            type: ApplicationCommandOptionType.String,
            required: false,
        },
    ],

    async execute({ client, context, settings, args, prefix }) {
        const modifiableSettings: { name: string; aliases?: string[]; default: unknown }[] = [
            { name: 'announce connect', default: client.config.defaultSettings.announceConnect },
            { name: 'announce disconnect', default: client.config.defaultSettings.announceDisconnect },
            { name: 'announce now playing', aliases: ['announce np'], default: client.config.defaultSettings.announceNowPlaying },
            { name: 'autoplay', aliases: ['ap'], default: client.config.defaultSettings.autoplay.enabled },
            { name: 'banned users', aliases: ['banned'], default: client.config.defaultSettings.banned },
            { name: 'buttons', default: client.config.defaultSettings.buttons },
            { name: 'cleanup', aliases: ['auto delete', 'delete'], default: client.config.defaultSettings.cleanup },
            { name: 'color', default: client.config.defaultSettings.color },
            { name: 'disabled channels', default: client.config.defaultSettings.disabledChannels },
            { name: 'disconnect timeout', default: client.config.defaultSettings.disconnectTimeout },
            { name: 'dj only', aliases: ['dj'], default: client.config.defaultSettings.dj.enabled },
            { name: 'dj role', aliases: ['djr'], default: client.config.defaultSettings.dj.role },
            { name: 'prefixes', aliases: ['prefix'], default: client.config.defaultSettings.prefixes },
            { name: 'search provider', aliases: ['source', 'provider'], default: client.config.defaultSettings.searchProvider },
            { name: 'set stage topic', aliases: ['topic'], default: client.config.defaultSettings.setStageTopic },
            // { name: 'statistics', default: client.config.defaultSettings.statistics },
            // { name: 'voteSkip', default: client.config.defaultSettings.voteSkip },
            // { name: 'voteSkipPercentage', default: client.config.defaultSettings.voteSkipPercentage }
        ];
        if (args.length) {
            const setting = args.join(' ').toLowerCase();
            const foundSetting = modifiableSettings.find(
                (s) =>
                    s.name.toLowerCase() === setting ||
                    s.name.split(' ').join('') === setting ||
                    (s.aliases?.length
                        ? s.aliases.map((a) => a.toLowerCase()).includes(setting) ||
                          s.aliases.map((a) => a.toLowerCase().split(' ').join('')).includes(setting)
                        : false),
            );
            if (!foundSetting)
                return client.respond(
                    context.channel,
                    `**Invalid usage.** Use \`${client.util.escapeBackticks(
                        prefix.replace(/<@!?\d+>/g, `@${client.user!.tag} `),
                    )}set\` to see all available settings.`,
                    'error',
                );
            const stringRow = new ActionRowBuilder<StringSelectMenuBuilder>();
            const buttonRow = new ActionRowBuilder<ButtonBuilder>();
            const mentionableRow = new ActionRowBuilder<MentionableSelectMenuBuilder>();
            const roleRow = new ActionRowBuilder<RoleSelectMenuBuilder>();
            const channelRow = new ActionRowBuilder<ChannelSelectMenuBuilder>();
            const embed = new EmbedBuilder()
                .setColor(settings.color)
                .setAuthor({
                    name: `Settings - ${foundSetting.name}`,
                    iconURL: client.user!.displayAvatarURL({ size: 4096 }),
                })
                .setFooter({ text: 'Use the action row below this embed to modify this setting.' });
            const successEmbed = new EmbedBuilder().setColor('#A6E3A1');
            const timeoutEmbed = new EmbedBuilder()
                .setColor('#F38BA8')
                .setDescription(`${client.config.emojis.error} | **Timed out before any interaction was received.**`);
            const filter = (interaction: MessageComponentInteraction) => {
                interaction.deferUpdate();
                return interaction.user.id === context.author.id && interaction.customId === 'set';
            };
            if (foundSetting.name === 'announce connect') {
                embed.setDescription(
                    tags.stripIndents`*If enabled, sends a notification in the bound text channel when Celerity connects to a voice channel via the \`play\` or \`connect\` command.*
                        **----------**
                        **Default value:** ${foundSetting.default}
                        **Current value:** ${settings.announceConnect}`,
                );
                stringRow.addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('set')
                        .setPlaceholder('Select an option...')
                        .addOptions(
                            new StringSelectMenuOptionBuilder().setLabel('true').setValue('true').setDescription('Enables connect notifications.'),
                            new StringSelectMenuOptionBuilder().setLabel('false').setValue('false').setDescription('Disables connect notifications.'),
                        ),
                );
                const message = await context.channel.send({ embeds: [embed], components: [stringRow] });
                const collector = message.createMessageComponentCollector({ filter, time: 120000, max: 1 });
                collector.on('collect', (i: StringSelectMenuInteraction) => {
                    settings.announceConnect = i.values[0] === 'true';
                    message.edit({
                        embeds: [
                            successEmbed.setDescription(
                                `${client.config.emojis.success} | Set **${foundSetting.name}** to \`${settings.announceConnect}\`.`,
                            ),
                        ],
                        components: [],
                    });
                });
                collector.on('end', async (collected) => {
                    if (!collected.size) message.edit({ embeds: [timeoutEmbed], components: [] });
                });
            } else if (foundSetting.name === 'announce disconnect') {
                embed.setDescription(
                    tags.stripIndents`*If enabled, sends a notification in the bound text channel when Celerity disconnects from the voice channel due to a timeout.
                        Timeouts can occur due to the player being inactive for too long (when there is no current track and no tracks in queue) or the voice channel having no undeafened users for an extended period of time.*
                        **----------**
                        **Default value:** ${foundSetting.default}
                        **Current value:** ${settings.announceDisconnect}`,
                );
                stringRow.addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('set')
                        .setPlaceholder('Select an option...')
                        .addOptions(
                            new StringSelectMenuOptionBuilder().setLabel('true').setValue('true').setDescription('Enables disconnect notifications.'),
                            new StringSelectMenuOptionBuilder()
                                .setLabel('false')
                                .setValue('false')
                                .setDescription('Disables disconnect notifications.'),
                        ),
                );
                const message = await context.channel.send({ embeds: [embed], components: [stringRow] });
                const collector = message.createMessageComponentCollector({ filter, time: 120000, max: 1 });
                collector.on('collect', (i: StringSelectMenuInteraction) => {
                    settings.announceDisconnect = i.values[0] === 'true';
                    message.edit({
                        embeds: [
                            successEmbed.setDescription(
                                `${client.config.emojis.success} | Set **${foundSetting.name}** to \`${settings.announceDisconnect}\`.`,
                            ),
                        ],
                        components: [],
                    });
                });
                collector.on('end', async (collected) => {
                    if (!collected.size) message.edit({ embeds: [timeoutEmbed], components: [] });
                });
            } else if (foundSetting.name === 'announce now playing') {
                embed.setDescription(
                    tags.stripIndents`*If enabled, sends a notification in the bound text channel whenever a track starts playing.
                        This notification contains the title and artist of the track, along with the requester of the track.*
                        **----------**
                        **Default value:** ${foundSetting.default}
                        **Current value:** ${settings.announceNowPlaying}`,
                );
                stringRow.addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('set')
                        .setPlaceholder('Select an option...')
                        .addOptions(
                            new StringSelectMenuOptionBuilder().setLabel('true').setValue('true').setDescription('Enables now playing messages.'),
                            new StringSelectMenuOptionBuilder().setLabel('false').setValue('false').setDescription('Disables now playing messages.'),
                        ),
                );
                const message = await context.channel.send({ embeds: [embed], components: [stringRow] });
                const collector = message.createMessageComponentCollector({ filter, time: 120000, max: 1 });
                collector.on('collect', (i: StringSelectMenuInteraction) => {
                    settings.announceNowPlaying = i.values[0] === 'true';
                    message.edit({
                        embeds: [
                            successEmbed.setDescription(
                                `${client.config.emojis.success} | Set **${foundSetting.name}** to \`${settings.announceNowPlaying}\`.`,
                            ),
                        ],
                        components: [],
                    });
                });
                collector.on('end', async (collected) => {
                    if (!collected.size) message.edit({ embeds: [timeoutEmbed], components: [] });
                });
            } else if (foundSetting.name === 'autoplay') {
                embed.setDescription(
                    tags.stripIndents`*If enabled, Celerity will play related tracks to the last played track when the queue ends. If no related tracks can be found, this setting will be automatically disabled. 
                        Tracks added using this feature will have their requester shown as <@${client.user!.id}>.*
                        **----------**
                        **Default value:** ${foundSetting.default}
                        **Current value:** ${settings.autoplay.enabled}`,
                );
                stringRow.addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('set')
                        .setPlaceholder('Select an option...')
                        .addOptions(
                            new StringSelectMenuOptionBuilder().setLabel('true').setValue('true').setDescription('Enables autoplay.'),
                            new StringSelectMenuOptionBuilder().setLabel('false').setValue('false').setDescription('Disables autoplay.'),
                        ),
                );
                const message = await context.channel.send({ embeds: [embed], components: [stringRow] });
                const collector = message.createMessageComponentCollector({ filter, time: 120000, max: 1 });
                collector.on('collect', (i: StringSelectMenuInteraction) => {
                    settings.autoplay.enabled = i.values[0] === 'true';
                    message.edit({
                        embeds: [
                            successEmbed.setDescription(
                                `${client.config.emojis.success} | Set **${foundSetting.name}** to \`${settings.autoplay.enabled}\`.`,
                            ),
                        ],
                        components: [],
                    });
                });
                collector.on('end', async (collected) => {
                    if (!collected.size) message.edit({ embeds: [timeoutEmbed], components: [] });
                });
            } else if (foundSetting.name === 'banned users') {
                const currentValue: string[] = [];
                const currentlyBanned = settings.banned;
                for (let x = 0; x < currentlyBanned.length; x++) {
                    const role = context.guild!.roles.cache.has(currentlyBanned[x]!);
                    if (role) currentValue.push(`<@&${currentlyBanned[x]!}>`);
                    else currentValue.push(`<@${currentlyBanned[x]!}>`);
                }
                embed.setDescription(
                    tags.stripIndents`*Users / roles in this list will not be allowed to use Celerity's commands within this server, regardless of permissions in the server.
                        Do note that using the drop-down appends to the list. To unban users / roles, simply select the banned users / roles and submit the interaction.
                        To unban **all** users / roles, select only Celerity in the drop-down menu and submit the interaction.*
                        **----------**
                        **Default value:** No default value
                        **Current value:** ${settings.banned.length ? currentValue.join(', ') : 'No banned users / roles'}`,
                );
                mentionableRow.addComponents(
                    new MentionableSelectMenuBuilder()
                        .setCustomId('set')
                        .setPlaceholder('Select up to 25 users and/or roles...')
                        .setMinValues(1)
                        .setMaxValues(25),
                );
                const message = await context.channel.send({ embeds: [embed], components: [mentionableRow] });
                const collector = message.createMessageComponentCollector({ filter, time: 120000, max: 1 });
                collector.on('collect', (i: UserSelectMenuInteraction) => {
                    const response: string[] = [];
                    const newUsers = i.values;
                    if (newUsers.includes(client.user!.id) && newUsers.length == 1) settings.banned = [];
                    else
                        for (let x = 0; x < newUsers.length; x++) {
                            if (newUsers[x]! === client.user!.id) continue;
                            else {
                                if (!settings.banned.includes(newUsers[x]!)) settings.banned.push(newUsers[x]!);
                                else settings.banned.splice(settings.banned.indexOf(newUsers[x]!), 1);
                            }
                        }
                    for (let x = 0; x < currentlyBanned.length; x++) {
                        const role = context.guild!.roles.cache.has(currentlyBanned[x]!);
                        if (role) response.push(`<@&${currentlyBanned[x]!}>`);
                        else response.push(`<@${currentlyBanned[x]!}>`);
                    }
                    message.edit({
                        embeds: [
                            successEmbed.setDescription(
                                `${client.config.emojis.success} | **The following users / roles are banned from using Celerity in this server:**\n${
                                    settings.banned.length ? response.join(', ') : 'None'
                                }`,
                            ),
                        ],
                        components: [],
                    });
                });
                collector.on('end', async (collected) => {
                    if (!collected.size) message.edit({ embeds: [timeoutEmbed], components: [] });
                });
            } else if (foundSetting.name === 'buttons') {
                embed.setDescription(
                    tags.stripIndents`*If enabled, adds player buttons to Celerity's now playing messages. This setting has two options: \`off\`, \`base\` and \`extra\`.
                        **__These are the buttons that will be shown based on your choice:__**
                        **\`off\`:** none
                        **\`base\`:** previous, pause/resume, skip, stop
                        **\`extra\`:** previous, pause/resume, skip, stop, rewind, shuffle, loop, queue, autoplay*
                        **----------**
                        **Default value:** ${foundSetting.default}
                        **Current value:** ${settings.buttons}`,
                );
                stringRow.addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('set')
                        .setPlaceholder('Select an option...')
                        .addOptions(
                            new StringSelectMenuOptionBuilder()
                                .setLabel('off')
                                .setValue('off')
                                .setDescription('Disables all buttons on now playing messages.'),
                            new StringSelectMenuOptionBuilder()
                                .setLabel('base')
                                .setValue('base')
                                .setDescription('Enables a few buttons (previous, pause/resume, skip, stop).'),
                            new StringSelectMenuOptionBuilder()
                                .setLabel('extra')
                                .setValue('extra')
                                .setDescription('Enables all buttons (previous, pause/resume, skip, stop, rewind, shuffle, loop, queue, autoplay).'),
                        ),
                );
                const message = await context.channel.send({ embeds: [embed], components: [stringRow] });
                const collector = message.createMessageComponentCollector({ filter, time: 120000, max: 1 });
                collector.on('collect', (i: StringSelectMenuInteraction) => {
                    if (i.values[0] !== 'base' && i.values[0] !== 'extra' && i.values[0] !== 'off') return;
                    settings.buttons = i.values[0];
                    message.edit({
                        embeds: [
                            successEmbed.setDescription(`${client.config.emojis.success} | Set **${foundSetting.name}** to \`${settings.buttons}\`.`),
                        ],
                        components: [],
                    });
                });
                collector.on('end', async (collected) => {
                    if (!collected.size) message.edit({ embeds: [timeoutEmbed], components: [] });
                });
            } else if (foundSetting.name === 'cleanup') {
                embed.setDescription(
                    tags.stripIndents`*If enabled, Celerity will delete the notification in the bound text channel from the track start event, when the track ends.
                        This also applies if the track is skipped, or the bot is stopped / disconnected.*
                        **----------**
                        **Default value:** ${foundSetting.default}
                        **Current value:** ${settings.cleanup}`,
                );
                stringRow.addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('set')
                        .setPlaceholder('Select an option...')
                        .addOptions(
                            new StringSelectMenuOptionBuilder()
                                .setLabel('true')
                                .setValue('true')
                                .setDescription('Enables automatic deletion of now playing messages.'),
                            new StringSelectMenuOptionBuilder()
                                .setLabel('false')
                                .setValue('false')
                                .setDescription('Disables automatic deletion of now playing messages.'),
                        ),
                );
                const message = await context.channel.send({ embeds: [embed], components: [stringRow] });
                const collector = message.createMessageComponentCollector({ filter, time: 120000, max: 1 });
                collector.on('collect', (i: StringSelectMenuInteraction) => {
                    settings.cleanup = i.values[0] === 'true';
                    message.edit({
                        embeds: [
                            successEmbed.setDescription(`${client.config.emojis.success} | Set **${foundSetting.name}** to \`${settings.cleanup}\`.`),
                        ],
                        components: [],
                    });
                });
                collector.on('end', async (collected) => {
                    if (!collected.size) message.edit({ embeds: [timeoutEmbed], components: [] });
                });
            } else if (foundSetting.name === 'color') {
                embed.setDescription(
                    tags.stripIndents`*This setting allows you to change Celerity's embed color for certain responses, and only accepts a hex string.
                        [W3Schools Color Picker](https://www.w3schools.com/colors/colors_picker.asp)*
                        **----------**
                        **Default value:** ${foundSetting.default}
                        **Current value:** ${settings.color}`,
                );
                buttonRow.addComponents(new ButtonBuilder().setCustomId('set').setLabel('Set Color').setStyle(ButtonStyle.Primary));
                const message = await context.channel.send({ embeds: [embed], components: [buttonRow] });
                const collector = message.createMessageComponentCollector({ filter, time: 120000, max: 1 });
                collector.on('collect', async () => {
                    const messageCollector = context.channel!.createMessageCollector({
                        time: 120000,
                        filter: (message) => message.author.id === context.author.id,
                        max: 1,
                    });
                    await message.edit({
                        embeds: [
                            new EmbedBuilder()
                                .setDescription(
                                    `${client.config.emojis.loading} | **Type and send the color you want Celerity to use for embeds here.**\nAccepts a hex string, not case-sensitive. (e.g. #CBA6F7)`,
                                )
                                .setColor('#F5C2E7'),
                        ],
                        components: [],
                    });
                    messageCollector.on('collect', async (msg: Message) => {
                        const color = msg.content.toUpperCase().replace('#', '');
                        await msg.delete().catch(() => null);
                        if (/^#?[\da-f]{6}$/i.test(color)) {
                            settings.color = `#${color}` as ColorResolvable;
                            message.edit({
                                embeds: [
                                    successEmbed.setDescription(
                                        `${client.config.emojis.success} | Set **${foundSetting.name}** to \`${settings.color}\`.`,
                                    ),
                                ],
                                components: [],
                            });
                            return;
                        } else {
                            message.edit({
                                embeds: [successEmbed.setColor('#F38BA8').setDescription(`${client.config.emojis.error} | **Invalid HEX code.**`)],
                            });
                            return;
                        }
                    });
                    messageCollector.on('end', async (collected) => {
                        if (!collected.size) message.edit({ embeds: [timeoutEmbed], components: [] });
                    });
                });
                collector.on('end', async (collected) => {
                    if (!collected.size) message.edit({ embeds: [timeoutEmbed], components: [] });
                });
            } else if (foundSetting.name === 'disabled channels') {
                embed.setDescription(
                    tags.stripIndents`*Celerity will not allow commands from the channels / categories in this list to be executed, and instead return an error message. Additionally, commands executed by users in voice channels within this list will be rejected.
                        Do note that using the drop-down appends to the list. To re-enable channels, simply select the disabled channels and submit the interaction.*
                        **----------**
                        **Default value:** No default value
                        **Current value:** ${
                            settings.disabledChannels.length
                                ? settings.disabledChannels.map((c) => `<#${c}>`).join(', ')
                                : 'No disabled channels / categories'
                        }`,
                );
                channelRow.addComponents(
                    new ChannelSelectMenuBuilder().setCustomId('set').setPlaceholder('Select up to 25 channels...').setMinValues(1).setMaxValues(25),
                );
                const message = await context.channel.send({ embeds: [embed], components: [channelRow] });
                const collector = message.createMessageComponentCollector({ filter, time: 120000, max: 1 });
                collector.on('collect', (i: ChannelSelectMenuInteraction) => {
                    const newChannels = i.values;
                    for (let x = 0; x < newChannels.length; x++) {
                        if (newChannels[x]! === client.user!.id) continue;
                        else {
                            if (!settings.disabledChannels.includes(newChannels[x]!)) settings.disabledChannels.push(newChannels[x]!);
                            else settings.disabledChannels.splice(settings.disabledChannels.indexOf(newChannels[x]!), 1);
                        }
                    }
                    message.edit({
                        embeds: [
                            successEmbed.setDescription(
                                `${client.config.emojis.success} | **Celerity will no longer work in the following channels / categories:**\n${
                                    settings.disabledChannels.length ? settings.disabledChannels.map((c) => `<#${c}>`).join(', ') : 'None'
                                }`,
                            ),
                        ],
                        components: [],
                    });
                });
                collector.on('end', async (collected) => {
                    if (!collected.size) message.edit({ embeds: [timeoutEmbed], components: [] });
                });
            } else if (foundSetting.name === 'disconnect timeout') {
                embed.setDescription(
                    tags.stripIndents`*The amount of time, in seconds, that Celerity should stay in a voice channel after the queue ends or after there are no users in the voice channel, before timing out and disconnecting.
                        Set to 0 to immediately disconnect. Must be between 0 and 3600 (max. 1 hour).*
                        **----------**
                        **Default value:** ${foundSetting.default}
                        **Current value:** ${settings.disconnectTimeout}`,
                );
                buttonRow.addComponents(new ButtonBuilder().setCustomId('set').setLabel('Set Timeout').setStyle(ButtonStyle.Primary));
                const message = await context.channel.send({ embeds: [embed], components: [buttonRow] });
                const collector = message.createMessageComponentCollector({ filter, time: 120000, max: 1 });
                collector.on('collect', async () => {
                    const messageCollector = context.channel!.createMessageCollector({
                        time: 120000,
                        filter: (message) => message.author.id === context.author.id,
                        max: 1,
                    });
                    await message.edit({
                        embeds: [
                            new EmbedBuilder()
                                .setDescription(
                                    `${client.config.emojis.loading} | **Type and send the timeout you would like here.**\nAccepts a number from 0 to 3600.`,
                                )
                                .setColor('#F5C2E7'),
                        ],
                        components: [],
                    });
                    messageCollector.on('collect', async (msg: Message) => {
                        if (isNaN(Number(msg.content))) {
                            await msg.delete().catch(() => null);
                            message.edit({
                                embeds: [successEmbed.setColor('#F38BA8').setDescription(`${client.config.emojis.error} | **Invalid number.**`)],
                            });
                            return;
                        } else if (Number(msg.content) < 0 || Number(msg.content) > 3600) {
                            await msg.delete().catch(() => null);
                            message.edit({
                                embeds: [
                                    successEmbed
                                        .setColor('#F38BA8')
                                        .setDescription(`${client.config.emojis.error} | **Invalid number.**\nAccepts: \`0 - 3600\``),
                                ],
                            });
                            return;
                        }
                        await msg.delete().catch(() => null);
                        settings.disconnectTimeout = Number(msg.content);
                        message.edit({
                            embeds: [
                                successEmbed.setDescription(
                                    `${client.config.emojis.success} | Set **${foundSetting.name}** to \`${settings.disconnectTimeout}\`.`,
                                ),
                            ],
                            components: [],
                        });
                        return;
                    });
                    messageCollector.on('end', async (collected) => {
                        if (!collected.size) message.edit({ embeds: [timeoutEmbed], components: [] });
                    });
                });
                collector.on('end', async (collected) => {
                    if (!collected.size) message.edit({ embeds: [timeoutEmbed], components: [] });
                });
            } else if (foundSetting.name === 'dj only') {
                embed.setDescription(
                    tags.stripIndents`*When enabled, if a DJ role is configured and Celerity is playing music in a voice channel while a user with the DJ role is present, only users who have the DJ role will be allowed to use all music commands.
                        Don't enable this if a DJ role is not configured.*
                        **----------**
                        **Default value:** ${foundSetting.default}
                        **Current value:** ${settings.dj.enabled}`,
                );
                stringRow.addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('set')
                        .setPlaceholder('Select an option...')
                        .addOptions(
                            new StringSelectMenuOptionBuilder().setLabel('true').setValue('true').setDescription('Enables DJ only mode.'),
                            new StringSelectMenuOptionBuilder().setLabel('false').setValue('false').setDescription('Disables DJ only mode.'),
                        ),
                );
                const message = await context.channel.send({ embeds: [embed], components: [stringRow] });
                const collector = message.createMessageComponentCollector({ filter, time: 120000, max: 1 });
                collector.on('collect', (i: StringSelectMenuInteraction) => {
                    settings.dj.enabled = i.values[0] === 'true';
                    message.edit({
                        embeds: [
                            successEmbed.setDescription(
                                `${client.config.emojis.success} | Set **${foundSetting.name}** to \`${settings.dj.enabled}\`.`,
                            ),
                        ],
                        components: [],
                    });
                });
                collector.on('end', async (collected) => {
                    if (!collected.size) message.edit({ embeds: [timeoutEmbed], components: [] });
                });
            } else if (foundSetting.name === 'dj role') {
                embed.setDescription(
                    tags.stripIndents`*Configures a DJ role for DJ only mode. To remove the DJ role, simply select it again.
                        When DJ only mode is enabled, if a DJ role is configured and Celerity is playing music in a voice channel while a user with the DJ role is present, only users who have the DJ role will be allowed to use all music commands.*
                        **----------**
                        **Default value:** No default value
                        **Current value:** ${settings.dj.role.length > 0 ? `<@&${settings.dj.role}>` : 'No DJ role'}`,
                );
                roleRow.addComponents(new RoleSelectMenuBuilder().setCustomId('set').setPlaceholder('Select a role...'));
                const message = await context.channel.send({ embeds: [embed], components: [roleRow] });
                const collector = message.createMessageComponentCollector({ filter, time: 120000, max: 1 });
                collector.on('collect', (i: RoleSelectMenuInteraction) => {
                    const newRoles = i.values;
                    if (settings.dj.role === newRoles[0]) {
                        settings.dj.role = '';
                        settings.dj.enabled = false;
                    } else settings.dj.role = newRoles[0]!;
                    message.edit({
                        embeds: [
                            successEmbed.setDescription(
                                `${client.config.emojis.success} | Set **${foundSetting.name}** to ${
                                    settings.dj.role.length > 0 ? `<@&${settings.dj.role}>` : '`none`'
                                }.`,
                            ),
                        ],
                        components: [],
                    });
                });
                collector.on('end', async (collected) => {
                    if (!collected.size) message.edit({ embeds: [timeoutEmbed], components: [] });
                });
            } else if (foundSetting.name === 'prefixes') {
                embed.setDescription(
                    tags.stripIndents`*Configures the server prefixes. Celerity's mention will always be a prefix, and this cannot be removed.
                        Accepts a space-separated list of prefixes. Spaces in prefixes can be configured by enclosing the prefix in double quotes. For example, in \`a b c\`, your prefixes would be \`a\`, \`b\` and \`c\`. However, in \`a "b c"\`, your prefixes would be \`a\` and \`b c\`.
                        If you didn't already know, prefixes are what command messages start with, that Celerity will recognise. For example, in your invocation message, \`${client.util.escapeBackticks(
                            prefix.replace(/<@!?\d+>/g, `@${client.user!.tag} `),
                        )}\` was your prefix.*
                        **----------**
                        **Default value:** \`${client.config.defaultSettings.prefixes.join('`, `')}\`
                        **Current value:** \`${settings.prefixes.join('`, `')}\``,
                );
                buttonRow.addComponents(new ButtonBuilder().setCustomId('set').setLabel('Set Prefixes').setStyle(ButtonStyle.Primary));
                const message = await context.channel.send({ embeds: [embed], components: [buttonRow] });
                const collector = message.createMessageComponentCollector({ filter, time: 120000, max: 1 });
                collector.on('collect', async () => {
                    const messageCollector = context.channel!.createMessageCollector({
                        time: 120000,
                        filter: (message) => message.author.id === context.author.id,
                        max: 1,
                    });
                    await message.edit({
                        embeds: [
                            new EmbedBuilder()
                                .setDescription(
                                    `${client.config.emojis.loading} | **Type and send the prefixes you would like to use here.**\nAccepts a space separated list of prefixes. Prefixes with spaces can be quoted in order to still count as a single prefix.`,
                                )
                                .setColor('#F5C2E7'),
                        ],
                        components: [],
                    });
                    messageCollector.on('collect', async (msg: Message) => {
                        await msg.delete().catch(() => null);
                        const prefixes = splitBySpacesWithQuotes(msg.content);
                        settings.prefixes = prefixes;
                        message.edit({
                            embeds: [
                                successEmbed.setDescription(
                                    `${
                                        client.config.emojis.success
                                    } | **Celerity will now respond to commands prefixed by the following:**\n${prefixes
                                        .map((prefix) => `- \`${client.util.escapeBackticks(prefix)}\``)
                                        .join('\n')}`,
                                ),
                            ],
                            components: [],
                        });
                        return;
                    });
                    messageCollector.on('end', async (collected) => {
                        if (!collected.size) message.edit({ embeds: [timeoutEmbed], components: [] });
                    });
                });
                collector.on('end', async (collected) => {
                    if (!collected.size) message.edit({ embeds: [timeoutEmbed], components: [] });
                });
            } else if (foundSetting.name === 'search provider') {
                const resolveProviderToString = (provider: string) => {
                    if (provider === 'ytsearch') return 'YouTube';
                    else if (provider === 'ytmsearch') return 'YouTube Music';
                    else if (provider === 'dzsearch') return 'Deezer';
                    else if (provider === 'spsearch') return 'Spotify';
                    else if (provider === 'scsearch') return 'SoundCloud';
                    else if (provider === 'amsearch') return 'Apple Music';
                    else if (provider === 'ymsearch') return 'Yandex Music';
                    else return;
                };
                embed.setDescription(
                    tags.stripIndents`*The default search provider in this server. Overridden by the \`--source\` / \`-s\` argument per search command.
                        This setting is only be used for track searching. Track resolving and streaming is still done separately. (excluding Deezer)*
                        **----------**
                        **Default value:** ${resolveProviderToString(client.config.defaultSettings.searchProvider)}
                        **Current value:** ${resolveProviderToString(settings.searchProvider)}`,
                );
                stringRow.addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('set')
                        .setPlaceholder('Select an option...')
                        .addOptions(
                            new StringSelectMenuOptionBuilder()
                                .setLabel('YouTube')
                                .setValue('ytsearch')
                                .setDescription('Uses YouTube as the search provider.'),
                            new StringSelectMenuOptionBuilder()
                                .setLabel('YouTube Music')
                                .setValue('ytmsearch')
                                .setDescription('Uses YouTube Music as the search provider.'),
                            new StringSelectMenuOptionBuilder()
                                .setLabel('Deezer')
                                .setValue('dzsearch')
                                .setDescription('Uses Deezer as the search provider.'),
                            new StringSelectMenuOptionBuilder()
                                .setLabel('Spotify')
                                .setValue('spsearch')
                                .setDescription('Uses Spotify as the search provider.'),
                            new StringSelectMenuOptionBuilder()
                                .setLabel('SoundCloud')
                                .setValue('scsearch')
                                .setDescription('Uses SoundCloud as the search provider.'),
                            new StringSelectMenuOptionBuilder()
                                .setLabel('Apple Music')
                                .setValue('amsearch')
                                .setDescription('Uses Apple Music as the search provider.'),
                            new StringSelectMenuOptionBuilder()
                                .setLabel('Yandex Music')
                                .setValue('ymsearch')
                                .setDescription('Uses Yandex Music as the search provider.'),
                        ),
                );
                const message = await context.channel.send({ embeds: [embed], components: [stringRow] });
                const collector = message.createMessageComponentCollector({ filter, time: 120000, max: 1 });
                collector.on('collect', (i: StringSelectMenuInteraction) => {
                    settings.searchProvider = i.values[0] as
                        | 'ytsearch'
                        | 'ytmsearch'
                        | 'dzsearch'
                        | 'spsearch'
                        | 'scsearch'
                        | 'amsearch'
                        | 'ymsearch';
                    message.edit({
                        embeds: [
                            successEmbed.setDescription(
                                `${client.config.emojis.success} | Set **${foundSetting.name}** to \`${resolveProviderToString(
                                    settings.searchProvider,
                                )}\`.`,
                            ),
                        ],
                        components: [],
                    });
                });
                collector.on('end', async (collected) => {
                    if (!collected.size) message.edit({ embeds: [timeoutEmbed], components: [] });
                });
            } else if (foundSetting.name === 'set stage topic') {
                embed.setDescription(
                    tags.stripIndents`*When enabled, if Celerity is moved to or joins a stage channel, Celerity will automatically start the stage and set the stage topic to the name and artist of the currently playing track.
                        Make sure that Celerity has adequate permissions before using this setting.*
                        **----------**
                        **Default value:** ${foundSetting.default}
                        **Current value:** ${settings.setStageTopic}`,
                );
                stringRow.addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('set')
                        .setPlaceholder('Select an option...')
                        .addOptions(
                            new StringSelectMenuOptionBuilder()
                                .setLabel('true')
                                .setValue('true')
                                .setDescription('Enables automatic setting of stage topics.'),
                            new StringSelectMenuOptionBuilder()
                                .setLabel('false')
                                .setValue('false')
                                .setDescription('Disables automatic setting of stage topics.'),
                        ),
                );
                const message = await context.channel.send({ embeds: [embed], components: [stringRow] });
                const collector = message.createMessageComponentCollector({ filter, time: 120000, max: 1 });
                collector.on('collect', (i: StringSelectMenuInteraction) => {
                    settings.setStageTopic = i.values[0] === 'true';
                    message.edit({
                        embeds: [
                            successEmbed.setDescription(
                                `${client.config.emojis.success} | Set **${foundSetting.name}** to \`${settings.setStageTopic}\`.`,
                            ),
                        ],
                        components: [],
                    });
                });
                collector.on('end', async (collected) => {
                    if (!collected.size) message.edit({ embeds: [timeoutEmbed], components: [] });
                });
            }
        } else {
            const embed = new EmbedBuilder()
                .setColor(settings.color)
                .setAuthor({
                    name: `Settings for ${context.guild!.name}`,
                    iconURL: context.guild!.iconURL({ size: 4096 }) || undefined,
                })
                .setDescription(
                    'These are the settings that are currently available for you to configure on Celerity.\n' +
                        `To modify a setting or view more information about it, use \`${client.util.escapeBackticks(
                            prefix.replace(/<@!?\d+>/g, `@${client.user!.tag} `),
                        )}set <setting>\`, where \`<setting>\` is the name of the setting you want to change, found below.\n`,
                )
                .setFields(
                    {
                        name: 'announce connect',
                        value: 'Notifications when Celerity joins a voice channel.',
                    },
                    {
                        name: 'announce disconnect',
                        value: 'Notifications when Celerity leaves a voice channel.',
                    },
                    {
                        name: 'announce now playing',
                        value: 'Notifications when a track starts playing.',
                    },
                    {
                        name: 'autoplay',
                        value: 'Automatically queue related tracks when a track ends.',
                    },
                    {
                        name: 'banned users',
                        value: "Ban certain users/roles from using Celerity's commands.",
                    },
                    {
                        name: 'buttons',
                        value: 'Configure the buttons on now playing messages.',
                    },
                    {
                        name: 'cleanup',
                        value: 'Automatically delete now playing messages when tracks end.',
                    },
                    {
                        name: 'color',
                        value: "Change the color of some of Celerity's embeds.",
                    },
                    {
                        name: 'disabled channels',
                        value: "Disable the use of Celerity's commands in certain channels/categories.",
                    },
                    {
                        name: 'disconnect timeout',
                        value: 'Configure inactivity timeouts before Celerity disconnects.',
                    },
                    {
                        name: 'dj only',
                        value: 'Restrict certain commands to users with the DJ role.',
                    },
                    {
                        name: 'dj role',
                        value: 'Set the role for **dj only**.',
                    },
                    {
                        name: 'prefixes',
                        value: 'Set the prefixes that Celerity responds to.',
                    },
                    {
                        name: 'search provider',
                        value: 'Set the search provider that Celerity uses in this server.',
                    },
                    {
                        name: 'set stage topic',
                        value: 'Set the stage topic to the name and artist of the currently playing track.',
                    },
                );
            return context.channel.send({ embeds: [embed] });
        }
    },
};

function splitBySpacesWithQuotes(str: string): string[] {
    const regex = /[^\s"]+|"([^"]*)"/gi;
    const result = [];
    let match;

    do {
        match = regex.exec(str);
        if (match !== null) {
            result.push(match[1] ? match[1] : match[0]);
        }
    } while (match !== null);

    return result;
}
