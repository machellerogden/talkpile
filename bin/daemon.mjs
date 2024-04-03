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
import { getConfig } from '../lib/config.js';
import { COLOR, printPrefix, printDefaultPrompt, inspect } from '../lib/print.js';
import { REPL } from '../lib/repl.js';
import { registerShutdown, exitSignal } from '../lib/exit.js';
import { GPT } from '../lib/gpt/index.js';
import { core } from '../lib/gpt/tools/index.js';
import { edit } from '../lib/input.js';
import enquirer from 'enquirer';
import { send, sendChunk, sendLog, prompt, editor } from '../lib/connection.js';
import { nanoid } from 'nanoid';

const clients = new Map();

async function main(env = env, args = argv.slice(2)) {

    const config = await getConfig(env, args);

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
                    shell_user: config.shell_user,
                    user: config.user,
                    working_directory: config.cwd,
                    geolocation: config.geolocation,
                    settings_path: config.settings_path
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

                session.kits = {};

                const delegates = await packageDelegates(session);

                session.delegates = delegates;

                const replFx = {
                    'get-input': async (session, q = '') => {
                        const input = await prompt(session.connection, q + ' ');
                        await sendChunk(session.connection, EOL);
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
                            `You are in command-mode. Run \`${config.kits.talk.command}\` command and ask for help.`
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
                    'send-error': (session, ...args) => {
                        const message = [
                            printPrompt(session),
                            printPrefix('error', COLOR.error),
                            ...args
                        ].join(' ');
                        console.error(message);
                        return send(session.connection, message);
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
                            const sendLog = !(['send-chunk','get-input'].includes(effect) || config.quiet);
                            const logText = printPrefix('repl.fx', COLOR.info) + ' ' + effect;
                            if (sendLog) replFx['send-log'](session, logText + ' start');
                            const result = await replFx[effect](session, ...args);
                            if (sendLog) replFx['send-log'](session, logText + ' end');
                            return result;
                        }
                        for (const [ kitName, kitConfig ] of Object.entries(config.kits)) {
                            if (kitConfig.disabled) continue;
                            const kit = session.kits[kitName];
                            if (effect in kit.fns) {
                                const logText = printPrefix(kitName + '.' + effect, COLOR.info);
                                await replFx['send-log'](session, logText + ' start');
                                const fn = kit.fns[effect];
                                if (!fn?.impl) {
                                    const error = new Error(`No implementation for ${kitName}.${effect}`);
                                    await replFx['send-error'](session, error.stack);
                                    return false;
                                }
                                if (fn?.confirm) {
                                    const error = await replFx.confirm(session, `Are you sure you want to run ${kitName}.${effect} with ${JSON.stringify(args[1])}?`, `Aborted ${kitName}.${effect}.`);
                                    if (error) return error;
                                }
                                const result = await kit.fns[effect].impl(...args);
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

async function packageDelegates(session) {
    const { config, printPrompt } = session;
    const delegates = {};
    // Below creates the delegation handlers for each kit.
    for (const [ kitName, kitConfig ] of Object.entries(config.kits)) {
        if (kitConfig.disabled) continue;

        try {
            if (config.debug) console.log(`Loading Kit:`, kitName, kitConfig);

            const kitModule = await import(kitConfig.import);

            const kit = session.kits[kitName] = await kitModule.load(session, kitName, kitConfig);

            kit.fns = Object.assign(kit.fns, core.fns);

            // GPT, I hereby appoint you as my delegate to be called upon when
            // the command is given. Know of this session and take with you the
            // tools in this kit. Go forth and do my bidding.
            delegates[kit.command] = async (task, from, role) => {

                role = role || 'user';
                from = from || 'user';
                task = task || `This is a request from ${from}. ${config.name} would like to chat. Please greet ${config.name}.`;

                const options = {
                    kit,
                    generateSummary: role != 'user'
                };
                options.message = { role: role == 'user' ? 'user' : 'system', content: task };

                if (!config.quiet) {
                    console.log([
                        printPrompt(session),
                        printPrefix('delegate', COLOR.info),
                        `Calling ${kit.command} delegate. `,
                        (task ? `Task: ` + task : ''),
                        `Requested by: ${from}.`
                    ].join(' '));
                }

                return GPT(session, options);
            }

        } catch (error) {
            console.error(`Error loading kit: ${kitName}`, error.stack);
            continue;
        }
    }
    return delegates;
}
