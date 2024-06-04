/*
    Celerity, a music Discord bot focused on performance, without sacrificing functionality, features and quality.
    Copyright (C) 2024 • Thaddeus Kuah • thaddeuskkr

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published
    by the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import chalk from 'chalk';
import dotenv from 'dotenv';
import { Celerity } from './util/client.js';

dotenv.config();

const require = createRequire(import.meta.url);

console.log(chalk.bold('   ______     __          _ __       '));
console.log(chalk.bold('  / ____/__  / /__  _____(_) /___  __'));
console.log(chalk.bold(' / /   / _ \\/ / _ \\/ ___/ / __/ / / /'));
console.log(chalk.bold('/ /___/  __/ /  __/ /  / / /_/ /_/ / '));
console.log(chalk.bold('\\____/\\___/_/\\___/_/  /_/\\__/\\__, /  '));
console.log(chalk.bold('                            /____/   '));
console.log(chalk.bold('—————————————————————————————————————'));
console.log(
    chalk
        .hex('#cba6f7')
        .bold.italic(
            `> ${chalk.hex('#f5c2e7').italic('Celerity • by thaddeuskkr')} | ${chalk.hex('#a6e3a1').italic(`Node.js ${process.version}`)} | ${chalk
                .hex('#89b4fa')
                .italic(`discord.js v${require('discord.js').version}`)}`
        )
);

const client = new Celerity();

for (const event of ['unhandledRejection', 'uncaughtException']) {
    process.on(event, (err) => {
        client.logger.error(`${err}`);
        console.error(err);
    });
}

process.on('SIGTERM', () => {
    client.logger.info('SIGTERM received, shutting down...');
    client.destroy();
    process.exit(0);
});

await client.initialise(path.dirname(fileURLToPath(import.meta.url)));
