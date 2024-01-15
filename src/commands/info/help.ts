import { ApplicationCommandOptionType, EmbedBuilder } from 'discord.js';
import { CelerityPaginatedMessage } from '../../util/pagination.js';
import type { Command } from '../../types';
import _ from 'lodash';

export const command: Command = {
    name: 'help',
    description: "Returns information about Celerity's commands.",
    aliases: ['commands', 'h'],
    checks: [],
    options: [
        {
            name: 'command',
            description: 'The command to get information about.',
            type: ApplicationCommandOptionType.String,
            required: false,
        },
    ],

    async execute({ client, context, settings, args, prefix }) {
        const owner = await client.users.fetch(client.config.owners[0]!);
        const cmd = args.join(' ');
        if (cmd) {
            const command = client.commands.get(cmd) || client.commands.find((c) => c.aliases && c.aliases.includes(cmd));
            if (!command)
                return client.respond(
                    context.channel,
                    `${client.config.emojis.error} | **Invalid command.**\nUse \`${client.util.escapeBackticks(
                        prefix.replace(/<@!?\d+>/g, `@${client.user!.tag} `),
                    )}help\` for a list of commands.`,
                    'error',
                );
            const embed = new EmbedBuilder()
                .setColor(settings.color)
                .setAuthor({
                    name: 'Command information',
                    iconURL: client.user!.displayAvatarURL({ size: 4096 }),
                    url: 'https://go.tkkr.dev/c-inv',
                })
                .setFooter({
                    text: `Made with ♡ by @${owner.username} • ${client.version}`,
                    iconURL: owner.displayAvatarURL({ size: 4096 }),
                })
                .addFields(
                    {
                        name: 'Name:',
                        value: `\`${command.name}\``,
                        inline: true,
                    },
                    {
                        name: 'Aliases:',
                        value: '`' + (command.aliases?.length ? command.aliases.join('`, `') : 'None') + '`',
                    },
                    {
                        name: 'Description:',
                        value: command.description,
                    },
                    {
                        name: 'Usage:',
                        value:
                            '`' +
                            `${client.util.escapeBackticks(prefix.replace(/<@!?\d+>/g, `@${client.user!.tag} `))}${command.name}${
                                command.options?.length ? ' ' : ''
                            }` +
                            command.options?.map((option) => `${option.required ? `<${option.name}>` : `[${option.name}]`}`).join(' ') +
                            '`',
                    },
                    {
                        name: 'Options:',
                        value: command.options?.length
                            ? command.options
                                  .map(
                                      (option) =>
                                          `**\`${option.name}\` ${option.required ? '(Required) ' : ''}- ${
                                              ApplicationCommandOptionType[option.type]
                                          }:** ${option.description}${option.choices ? ` (${option.choices.length} choices)` : ''}`,
                                  )
                                  .join('\n')
                            : 'None',
                    },
                )
                .setDescription('**Note:** `<>` denotes a required argument, while `[]` denotes an optional argument.');
            return client.respond(context.channel, embed, 'none');
        }
        const paginatedMessage = new CelerityPaginatedMessage(client, {
            template: new EmbedBuilder()
                .setAuthor({ name: 'Celerity', iconURL: client.user!.displayAvatarURL({ size: 4096 }) })
                .setURL('https://go.tkkr.dev/c-inv')
                .setColor(settings.color)
                .setFooter({
                    text: `Made with ♡ by @${owner.username} • ${client.version}`,
                    iconURL: owner.displayAvatarURL({ size: 4096 }),
                }),
        });
        const musicMap = client.commands.filter((c) => c.category === 'music').map((c) => `**${c.name}** - ${c.description}`);
        const musicCommands = _.chunk(musicMap, Math.ceil(musicMap.length / 2));
        paginatedMessage.addPageEmbed(
            new EmbedBuilder().setTitle('Informative Commands').setDescription(
                client.commands
                    .filter((c) => c.category === 'info')
                    .map((c) => `**${c.name}** - ${c.description}`)
                    .join('\n'),
            ),
        );
        paginatedMessage.addPageEmbed(new EmbedBuilder().setTitle('Music Commands [1/2]').setDescription(musicCommands[0]!.join('\n')));
        paginatedMessage.addPageEmbed(new EmbedBuilder().setTitle('Music Commands [2/2]').setDescription(musicCommands[1]!.join('\n')));
        paginatedMessage.addPageEmbed(
            new EmbedBuilder().setTitle('Utility Commands').setDescription(
                client.commands
                    .filter((c) => c.category === 'util')
                    .map((c) => `**${c.name}** - ${c.description}`)
                    .join('\n'),
            ),
        );
        return paginatedMessage.run(context);
    },
};
