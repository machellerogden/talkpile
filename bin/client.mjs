#!/usr/bin/env node

/**
 * Copyright 2024 Mac Heller-Ogden
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import net from 'node:net';
import os from 'node:os';
import { realpathSync } from 'node:fs';
import { argv, env, stdin, stdout, cwd } from 'node:process';
import * as url from 'node:url';
import * as readline from 'node:readline';
import { editAsync } from 'external-editor';
import { getClientConfig } from '../lib/config.js';

const { EOL } = os;
const exitController = new AbortController();
const exitSignal = exitController.signal;

export function exit(ms = 0) {
    exitController.timeout(ms);
}

const edit = async (text, config) => new Promise((resolve, reject) => {
    editAsync(text, (error, data) => {
        if (error) return reject(error);
        return resolve(data);
    }, config);
});

function tryParseData(json) {
    try {
        return JSON.parse(json);
    } catch (e) {
        return { message: '', prompt: true };
    }
}

async function main(env = env, args = argv.slice(2)) {

    const config = await getClientConfig(env, args);

    let initialInput = config.input.join(' ');

    initialInput = initialInput.length
        ? `talkpile ${initialInput}`
        : 'talkpile Hello, Talkpile.';

    stdin.setRawMode(true);

    const rl = readline.createInterface({
        input: stdin,
        output: stdout,
        terminal: true,
        crlfDelay: Infinity,
        prompt: EOL + '> '
    });

    if (config.debug) {
        console.table({
            ...process.versions,
            ...process.release,
            pid: process.pid,
            ppid: process.ppid,
            arch: process.arch,
            platform: process.platform,
            title: process.title,
            argv0: process.argv0,
            debugPort: process.debugPort
        });
    }

    const { host, port } = config;

    const socket = net.createConnection({ host, port });

    let incoming = '';
    let depth = 0;
    let inQuote = false;

    socket.on('data', async buf => {

        const str = buf.toString();
        const chars = str.split('');

        for (let i = 0; i < chars.length; i++) {
            incoming += chars[i];
            if (chars[i - 1] == '\\' && chars[i] == '"') continue;
            if (chars[i] == '"') {
                inQuote = !inQuote;
                continue;
            }
            if (inQuote) continue;
            if (['{','['].includes(chars[i])) {
                depth++;
                continue;
            }
            if (['}',']'].includes(chars[i])) {
                depth--;
                continue;
            }
            if (depth == 0 && !inQuote) {
                const data = tryParseData(incoming);

                // handle context requests
                if (data?.contextRequest) {
                    let message;

                    if (data?.message) {
                        if (data.message == 'get_client_context') {
                            message = JSON.stringify({
                                user: config.user,
                                working_directory: cwd(),
                                shell_user: os.userInfo().username,
                                ...config.context
                            });
                        } else if (data.message in config) {
                            if (data.message in config) {
                                message = config[data.message];
                            } else {
                                stdout.write(`${data.message ?? ''}\r\n`);
                                rl.prompt(true);
                                incoming = '';
                                continue;
                            }
                        }
                    }

                    socket.write(`${JSON.stringify({ message })}\r\n`);
                    incoming = '';
                    continue;
                }

                if (data?.chunk && data?.message) {
                    stdout.write(data.message);
                } else if (
                    data?.message?.trim().length
                    && !data?.quiet
                    && !(data?.log && config.quiet)
                ) {
                    stdout.write(`${data.message ?? ''}${EOL}`);
                }

                if (data?.system) {
                    if (data?.message == 'initial_input') {
                        socket.write(`${JSON.stringify({ message: initialInput })}\r\n`);
                    }
                } else if (data?.prompt) {
                    rl.prompt(true);
                } else if (data?.editor) {
                    const message = await edit(data?.message);
                    socket.write(`${JSON.stringify({ message })}\r\n`);
                }

                incoming = '';
            }
        }

    }).on('end', () => {
        process.exit(0);
    });

    readline.cursorTo(stdin, 0);

    rl.on('line', message => {
        socket.write(`${JSON.stringify({ message })}\r\n`);
    }).on('close', () => {
        console.log('exiting...');
        process.exit(0);
    });

    function shutdown(exitCode) {
        exitCode = typeof exitCode == 'number' ? exitCode : 1;
        if (exitCode == 0) console.log('Good bye.');
        process.exit(exitCode);
    }

    exitSignal.addEventListener('abort', () => shutdown(0), { once: true });
    process.on('exit', shutdown);
    process.on('SIGINT', shutdown);
    process.on('uncaughtException', e => {
        console.error('uncaughtException', e.stack);
        shutdown(1);
    });
    process.on('unhandledRejection', e => {
        console.error('unhandledRejection', e.stack);
        shutdown(1);
    });
}

if (process.stdin.isTTY
    && import.meta.url.startsWith('file:')
    && realpathSync(argv[1]) === url.fileURLToPath(import.meta.url)
) {

    const title = 'talkpile-client';
    process.title = title;
    process.stdout.write(String.fromCharCode(27) + "]0;" + title + String.fromCharCode(7));

    main(env, argv.slice(2));
}
