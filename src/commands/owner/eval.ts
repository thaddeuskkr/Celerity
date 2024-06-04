import { createRequire } from 'node:module';
import util from 'node:util';
import tags from 'common-tags';
import { ApplicationCommandOptionType } from 'discord.js';
import type { Command } from '../../types';

const nl = '!!NL!!';
const nlPattern = new RegExp(nl, 'g');

export const command: Command = {
    name: 'eval',
    description: 'Evaluates JavaScript code.',
    aliases: ['ev'],
    checks: ['owner'],
    userPermissions: [],
    options: [
        {
            name: 'code',
            description: 'The code to be evaluated.',
            type: ApplicationCommandOptionType.String,
            required: true
        }
    ],

    /* eslint-disable @typescript-eslint/no-unused-vars */
    // @ts-expect-error The unused variables are helpers that are optionally used during runtime.
    async execute({ client, context, args, settings, prefix, player, connection }) {
        // @ts-expect-error This is a helper that is optionally used during runtime.
        const require = createRequire(import.meta.url);
        // @ts-expect-error This is a helper that is optionally used during runtime.
        const lastEvalResult = client.util.eval.lastEvalResult;
        // @ts-expect-error This is a helper that is optionally used during runtime.
        const message = context;
        /* eslint-enable @typescript-eslint/no-unused-vars */

        let code = args.join(' ');

        // Remove any surrounding code blocks before evaluation
        if (code.startsWith('```') && code.endsWith('```')) {
            code = code.replace(/(^.*?\s)|(\n.*$)/g, '');
        }

        // Run the code and measure its execution time
        let hrDiff: [number, number] | null = null;
        try {
            const hrStart = process.hrtime();
            // biome-ignore lint/security/noGlobalEval: This eval is secured.
            client.util.eval.lastEvalResult = eval(code);
            hrDiff = process.hrtime(hrStart);
        } catch (err) {
            return context.channel.send(`Error while evaluating: \`${err}\``);
        }

        // Prepare for callback time and respond
        client.util.eval.hrStart = process.hrtime();
        const result = makeResultMessages(client.util.eval.lastEvalResult, hrDiff, code);
        if (Array.isArray(result)) {
            return result.map((item) => context.channel.send(item));
        }
        return context.channel.send(result);

        function makeResultMessages(result: string | null, hrDiff: [number, number], input: string | null = null): string[] {
            const inspected = util.inspect(result, { depth: 0 }).replace(nlPattern, '\n').replace(client.util.sensitivePattern, '--snip--');
            const split = inspected.split('\n');
            const last = inspected.length - 1;
            const prependPart = inspected[0] !== '{' && inspected[0] !== '[' && inspected[0] !== "'" ? split[0] : inspected[0];
            const appendPart = inspected[last] !== '}' && inspected[last] !== ']' && inspected[last] !== "'" ? split[split.length - 1] : inspected[last];
            const prepend = `\`\`\`javascript\n${prependPart}\n`;
            const append = `\n${appendPart}\n\`\`\``;
            if (input) {
                return splitMessage(
                    tags.stripIndents`
                    ***Executed in ${hrDiff[0] > 0 ? `${hrDiff[0]}s ` : ''}${hrDiff[1] / 1000000}ms.***
                    \`\`\`javascript
                    ${inspected}
                    \`\`\`
                `,
                    { maxLength: 1900, prepend, append }
                );
            }
            return splitMessage(
                tags.stripIndents`
                    ***Callback executed after ${hrDiff[0] > 0 ? `${hrDiff[0]}s ` : ''}${hrDiff[1] / 1000000}ms.***
                    \`\`\`javascript
                    ${inspected}
                    \`\`\`
                `,
                { maxLength: 1900, prepend, append }
            );
        }

        function splitMessage(text: string, { maxLength = 2000, char = '\n', prepend = '', append = '' } = {}) {
            const finalText = resolveString(text);
            if (finalText.length <= maxLength) return [finalText];
            const splitText = finalText.split(char);
            if (splitText.some((chunk) => chunk.length > maxLength)) throw new RangeError('SPLIT_MAX_LEN');
            const messages = [];
            let msg = '';
            for (const chunk of splitText) {
                if (msg && (msg + char + chunk + append).length > maxLength) {
                    messages.push(msg + append);
                    msg = prepend;
                }
                msg += (msg && msg !== prepend ? char : '') + chunk;
            }
            return messages.concat(msg).filter((m) => m);
        }

        function resolveString(data: unknown) {
            if (typeof data === 'string') return data;
            if (Array.isArray(data)) return data.join('\n');
            return String(data);
        }
    }
};
