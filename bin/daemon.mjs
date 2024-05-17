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
import { EOL } from 'node:os';
import * as readline from 'node:readline/promises';
import { realpathSync } from 'node:fs';
import * as url from 'node:url';
import { stdin, stdout, env, argv, exit } from 'node:process';
import { tryWithEffects } from 'with-effects';
import OpenAI from 'openai';
import { getDaemonConfig } from '../lib/config.js';
import { COLOR, printPrefix, printDefaultPrompt, inspect } from '../lib/print.js';
import { REPL } from '../lib/repl.js';
import { registerShutdown, exitSignal } from '../lib/exit.js';
import { packageAgents, packageDelegates, getTools } from '../lib/ai/index.js';
import { edit } from '../lib/input.js';
import enquirer from 'enquirer';
import { send, sendChunk, sendLog, sendQuietLog, sendSystemRequest, sendContextRequest, prompt, editor } from '../lib/connection.js';
import { nanoid } from 'nanoid';

const clients = new Map();

async function main(env = env, args = argv.slice(2)) {

    const config = await getDaemonConfig(env, args);

    // TODO - make configurable
    const printPrompt = printDefaultPrompt;

    const server = net.createServer(
        async function handleConnection(connection) {
            let clientId = nanoid(8);

            console.log(
                printPrompt(),
                printPrefix('info', COLOR.info),
                'client connected',
                clientId
            );

            try {

                clients.set(clientId, { connection });

                const openai = new OpenAI({
                    apiKey: config.OPENAI_API_KEY
                });

                const context = {
                    user: await prompt(connection, 'user', sendContextRequest) ?? config.user,
                    shell_user: await prompt(connection, 'shell_user', sendContextRequest) ?? config.shell_user,
                    working_directory: await prompt(connection, 'working_directory', sendContextRequest) ?? config.cwd,
                    geolocation: config.geolocation
                };

                const prefixes = [];

                const session = {
                    config,
                    context,
                    prefixes,
                    printPrompt,
                    connection
                };

                send(connection, [
                    printPrompt(session),
                    printPrefix('info', COLOR.info),
                    `connected as ${clientId}`
                ].join(' '));

                session.agents = await packageAgents(session);
                session.delegates = await packageDelegates(session);

                const replFx = {
                    'get-initial-input': async (session) => {
                        const input = await prompt(session.connection, 'initial_input', sendSystemRequest);
                        return input;
                    },
                    'get-input': async (session, q = '') => {
                        const input = await prompt(session.connection, q);
                        return input;
                    },
                    'get-editor-input': (session) => editor(session.connection),
                    'send-chunk': (session, chunk) => {
                        return sendChunk(session.connection, chunk);
                    },
                    'confirm': async (session, question, error) => {
                        const answer = await prompt(session.connection, question + ' (y/n)');
                        const confirm = answer.trim().toLowerCase() === 'y';
                        if (!confirm) return error;
                    },
                    'help': (session) => {
                        const message = [
                            printPrompt(session),
                            printPrefix('help', COLOR.success),
                            `You are in command-mode. Run \`${session.agents.talkpile.designation}\` command and ask for help.`
                        ].join(' ');
                        console.log(message);
                        return send(session.connection, message);
                    },
                    'request-chat-completion': async (session, request) => {
                        const response = await openai.chat.completions.create(request);
                        return response;
                    },
                    'disconnect': async (session) => {
                        session.connection.destroy();
                    },
                    'send-log': (session, ...args) => {
                        const message = [
                            printPrompt(session),
                            ...args
                        ].join(' ');
                        console.log(message);
                        return sendLog(session.connection, message);
                    },
                    'send-quiet-log': (session, ...args) => {
                        const message = [
                            printPrompt(session),
                            ...args
                        ].join(' ');
                        console.log(message);
                        return sendQuietLog(session.connection, message);
                    },
                    'send-error': (session, ...args) => {
                        const message = [
                            printPrompt(session),
                            printPrefix('error', COLOR.error),
                            ...args
                        ].join(' ');
                        console.error(message);
                        return sendLog(session.connection, message);
                    },
                    'send-warning': (session, ...args) => {
                        const message = printPrompt(session) + ' ' + printPrefix('warning', COLOR.warn) + ' ' + args.join(' ');
                        console.warn(message);
                        return send(session.connection, message);
                    },
                    'unhandled-tool-call': (session, tool_call) => {
                        const message = printPrompt(session) + ' ' + printPrefix('error', COLOR.error) + ' ' + 'unhandled-tool-call';
                        console.warn(message);
                        return send(session.connection, message);
                    }
                };

                async function handleEffect(effect, ...args) {
                    try {
                        if (effect in replFx) {
                            const shouldSend = !(['send-chunk'].includes(effect) || config.quiet);

                            const logEffect = [
                                'request-chat-completion',
                                'get-input',
                                'get-initial-input'
                            ].includes(effect) ? 'send-quiet-log' : 'send-log';

                            const logText = printPrefix('repl.fx', COLOR.info) + ' ' + effect;
                            if (shouldSend) replFx[logEffect](session, logText + ' start');
                            const result = await replFx[effect](session, ...args);
                            if (shouldSend) replFx[logEffect](session, logText + ' end');

                            return result;
                        }

                        // TODO: scope to current agent tools...
                        for (const agent of Object.values(session.agents)) {
                            if (agent.disabled) continue;
                            const tools = await getTools(session, agent);
                            if (effect in tools) {
                                const logText = printPrefix(agent.designation + '.' + effect, COLOR.info);
                                await replFx['send-log'](session, logText + ' start');
                                const tool = tools[effect];
                                if (!tool?.impl) {
                                    const error = new Error(`No implementation for ${agent.designation}.${effect}`);
                                    await replFx['send-error'](session, error.stack);
                                    return false;
                                }
                                if (tool?.confirm) {
                                    const error = await replFx.confirm(session, `Are you sure you want to run ${agent.designation}.${effect} with ${JSON.stringify(args[0], null, 4)}?`, `Aborted ${agent.designation}.${effect}.`);
                                    if (error) return error;
                                }
                                const result = await tools[effect].impl(session, agent, ...args);
                                await replFx['send-log'](session, logText + ' end');
                                return result;
                            }
                        }
                    } catch (error) {
                        return replFx['send-error'](session, error.stack);
                    }
                }

                await tryWithEffects(
                    REPL(session),
                    handleEffect,
                    (error) => console.error(error.stack)

                );

                connection.on('end', () => {
                    clients.delete(clientId);
                    console.log(
                        printPrompt(),
                        printPrefix('info', COLOR.info),
                        'client disconnected'
                    );
                });

            } catch (e) {
                console.error(e.stack);
            }
        }
    );

    server.on('error', (err) => {
        console.error(
            printPrompt(),
            printPrefix('error', COLOR.error),
            err.stack
        );
        throw err;
    });

    server.listen(config.port, () => {
        console.log(printPrompt(), printPrefix('info', COLOR.info), `listening on`, server.address().port);
    });

}

if (stdin.isTTY
    && import.meta.url.startsWith('file:')
    && realpathSync(argv[1]) === url.fileURLToPath(import.meta.url)
) {

    function shutdown(exitCode) {
        console.log('exit code:', exitCode);
        exitCode = exitCode ?? 0;
        console.log('good bye!');
        for (const [clientId, client] of clients) {
            console.log(`disconnecting client ${clientId}`);
            clients.delete(clientId);
            client.connection.end();
        }
        try {
            console.log('closing server connection...');
            server.close();
            console.log('server connection close.');
        } catch (e) {
            console.error('unable to close server connection. you may need to manually unlink the socket.');
            console.error(e.stack);
        }
        exit(exitCode);
    }

    registerShutdown();

    (async () => {
        try {
            await main(env, argv.slice(2));
        } catch (error) {
            console.error(error.stack);
            shutdown(1);
        }
    })();

}
