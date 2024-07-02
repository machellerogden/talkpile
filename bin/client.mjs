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
import jsonrpc from 'jsonrpc-lite';

const { EOL } = os;
const exitController = new AbortController();
const exitSignal = exitController.signal;

export function exit(ms = 0) {
    exitController.timeout(ms);
}

const edit = async (text, config) => new Promise((resolve, reject) => {
    editAsync(text, (error, value) => {
        if (error) return reject(error);
        return resolve(value);
    }, config);
});

function tryParseNull(json) {
    try {
        return JSON.parse(json);
    } catch {
        return;
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
    let rpcId;
    let rpcMethod;

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
                const rpc = tryParseNull(incoming);

                if (!rpc || !rpc.id || !rpc.method) {
                    console.error('invalid rpc', incoming);
                    // tolerate for now...
                    rl.prompt(true);
                    incoming = '';
                    continue;
                }

                rpcId = rpc.id;
                rpcMethod = rpc.method

                switch (rpcMethod) {

                    case 'get-client-context':
                        socket.write(`${JSON.stringify(jsonrpc.success(rpcId, {
                            user: config.user,
                            working_directory: cwd(),
                            shell_user: os.userInfo().username,
                            ...config.context
                        }))}\r\n`);
                        break;

                    case 'log-message':
                        if (rpc.params.level == 'info' && !config.quiet) {
                            stdout.write((rpc.params.message ?? '') + EOL);
                        }
                        break;

                    case 'print-message':
                        stdout.write((rpc.params.message ?? '') + EOL);
                        break;

                    case 'print-chunk':
                        stdout.write(rpc.params.chunk ?? '');
                        break;

                    case 'resolve-initial-input':
                        socket.write(`${JSON.stringify(jsonrpc.success(rpcId, initialInput))}\r\n`);
                        break;

                    case 'get-user-input':
                        rl.prompt(true);
                        break;

                    case 'get-editor-input':
                        const input = await edit(rpc?.params.message);
                        socket.write(`${JSON.stringify(jsonrpc.success(rpcId, input))}\r\n`);
                        break;

                    default:
                        console.log('wat?', rpc);
                        rl.prompt(true);
                        break;
                }

                incoming = '';
            }
        }

    }).on('end', () => {
        process.exit(0);
    });

    readline.cursorTo(stdin, 0);

    rl.on('line', message => {
        socket.write(`${JSON.stringify(jsonrpc.success(rpcId, message))}\r\n`);
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
