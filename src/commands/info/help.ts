import { ApplicationCommandOptionType, EmbedBuilder } from 'discord.js';
import _ from 'lodash';
import type { Command } from '../../types';
import { CelerityPaginatedMessage } from '../../util/pagination.js';

export const command: Command = {
    name: 'help',
    description: "Returns information about Celerity's commands.",
    aliases: ['commands', 'h'],
    examples: ['{p}help', '{p}help play'],
    checks: [],
    options: [
        {
            name: 'command',
            description: 'The command to get information about.',
            type: ApplicationCommandOptionType.String,
            required: false
        }
    ],

    async execute({ client, context, settings, args, prefix }) {
        const cmd = args.join(' ');
        if (cmd) {
            const command = client.commands.get(cmd) || client.commands.find((c) => c.aliases?.includes(cmd));
            if (!command || (command.checks?.includes('owner') && !client.config.owners.includes(context.author.id)))
                return client.respond(
                    context,
                    `${client.config.emojis.error} | **Invalid command.**\nUse \`${client.util.escapeBackticks(
                        prefix.replace(/<@!?\d+>/g, `@${client.user!.tag} `)
                    )}help\` for a list of commands.`,
                    'error'
                );
            const embed = new EmbedBuilder()
                .setColor(settings.color)
                .setAuthor({
                    name: 'Command Information',
                    iconURL: client.user!.displayAvatarURL({ size: 4096 }),
                    url: 'https://go.tkkr.dev/c-inv'
                })
                .setFooter({
                    text: `Use ${prefix}help for a list of all commands • ${client.version}`
                })
                .addFields(
                    {
                        name: 'Name:',
                        value: `\`${command.name}\``,
                        inline: true
                    },
                    {
                        name: 'Aliases:',
                        value: `\`${command.aliases?.length ? command.aliases.join('`, `') : 'None'}\``,
                        inline: true
                    },
                    {
                        name: 'Description:',
                        value: command.description
                    },
                    {
                        name: 'Usage:',
                        value: `\`${client.util.escapeBackticks(prefix.replace(/<@!?\d+>/g, `@${client.user!.tag} `))}${command.name}${
                            command.options?.length ? ' ' : ''
                        }${command.options?.map((option) => `${option.required ? `<${option.name}>` : `[${option.name}]`}`).join(' ')}\``
                    },
                    {
                        name: 'Options:',
                        value: command.options?.length
                            ? command.options
                                  .map(
                                      (option) =>
                                          `**\`${option.name}\` ${option.required ? '(Required) ' : ''}- ${ApplicationCommandOptionType[option.type]}:** ${
                                              option.description
                                          }${option.choices ? ` (${option.choices.length} choices)` : ''}`
                                  )
                                  .join('\n')
                            : 'None'
                    }
                )
                .setDescription('**Note:** `<>` denotes a required argument, while `[]` denotes an optional argument.');
            if (command.examples && command.examples.length > 0)
                embed.addFields({
                    name: 'Examples:',
                    value: command.examples.map((example) => `- \`${example.replace('{p}', prefix)}\``).join('\n')
                });
            if (command.tips && command.tips.length > 0)
                embed.addFields({
                    name: 'Tips:',
                    value: command.tips.map((tip) => `- ${tip.replace('{p}', prefix)}`).join('\n')
                });
            return client.respond(context, embed, 'none');
        }
        const paginatedMessage = new CelerityPaginatedMessage(client, {
            template: new EmbedBuilder()
                .setAuthor({ name: 'Celerity', iconURL: client.user!.displayAvatarURL({ size: 4096 }) })
                .setURL('https://celerity.tkkr.dev')
                .setColor(settings.color)
                .setFooter({
                    text: `Use ${prefix}help [command] for more information about a specific command • ${client.version}`
                })
        });
        const musicMap = client.commands.filter((c) => c.category === 'music').map((c) => `**${c.name}** - ${c.description}`);
        const musicCommands = _.chunk(musicMap, Math.ceil(musicMap.length / 2));
        paginatedMessage.addPageEmbed(
            new EmbedBuilder().setTitle('Informative').setDescription(
                client.commands
                    .filter((c) => c.category === 'info')
                    .map((c) => `**${c.name}** - ${c.description}`)
                    .join('\n')
            )
        );
        paginatedMessage.addPageEmbed(new EmbedBuilder().setTitle('Music [1/2]').setDescription(musicCommands[0]!.join('\n')));
        paginatedMessage.addPageEmbed(new EmbedBuilder().setTitle('Music [2/2]').setDescription(musicCommands[1]!.join('\n')));
        paginatedMessage.addPageEmbed(
            new EmbedBuilder().setTitle('Utility').setDescription(
                client.commands
                    .filter((c) => c.category === 'util')
                    .map((c) => `**${c.name}** - ${c.description}`)
                    .join('\n')
            )
        );
        return paginatedMessage.run(context);
    }
};
