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

import * as readline from 'node:readline/promises';
import { realpathSync } from 'node:fs';
import * as url from 'node:url';
import { stdin, stdout, env, argv } from 'node:process';
import { tryWithEffects } from 'with-effects';
import OpenAI from 'openai';
import { getConfig } from '../lib/config.js';
import { COLOR, printPrefix, printDefaultPrompt, inspect } from '../lib/print.js';
import { REPL } from '../lib/repl.js';
import { registerShutdown, shutdown } from '../lib/exit.js';
import { GPT } from '../lib/gpt/index.js';
import { core } from '../lib/gpt/tools/index.js';
import { edit } from '../lib/input.js';
import enquirer from 'enquirer';

async function main(env = env, args = argv.slice(2)) {

    const config = await getConfig(env, args);

    const rl = readline.createInterface({
        input: stdin,
        output: stdout,
        autoCommit: true
    });

    rl.pause();

    const openai = new OpenAI({
        apiKey: config.openaiApiKey
    });

    const context = {
        shell_user: config.shell_user,
        working_directory: config.cwd,
        geolocation: config.geolocation
    };

    // TODO - make configurable
    const printPrompt = printDefaultPrompt;

    const prefixes = [];

    const session = {
        config,
        context,
        prefixes,
        printPrompt,
        rl
    };

    const defaultKitConfigs = {
        'talk': {
            name: 'Talkpile',
            command: 'talk',
            import: '../lib/gpt/kits/talk.js',
            model: 'gpt-4-0125-preview',
            temperature: 0.4,
            frequency_penalty: 0.1,
            presence_penalty: 0.2
        }
    };

    const kitConfigs = {
        ...defaultKitConfigs,
        ...(config.kits ?? {})
    };

    session.kits = {};

    const delegates = {};

    // Below creates the delegation handlers for each kit.
    // TODO - factor this out
    for (const [ kitName, kitConfig ] of Object.entries(kitConfigs)) {
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

                console.log(
                    printPrompt(session) +
                    printPrefix('delegate', COLOR.info) +
                    ` Calling ${kit.command} delegate. ` +
                    (task ? `Task: ` + task : '') +
                    `Requested by: ${from}.`
                );

                return GPT(session, options);
            }

        } catch (error) {
            console.error(`Error loading kit: ${kitName}`, error.stack);
            continue;
        }
    }

    session.delegates = delegates;

    let more = true;

    const replFx = {
        'get-input': async (effect, question) => {
            question = question ?? printPrompt(session);
            const input = await rl.question(question);
            rl.pause();
            return input;
        },
        'get-editor-input': async () => {
            const input = await edit('');
            return input;
        },
        'edit-settings': async () => {
            const input = await edit('');
            return input;
        },
        'send-chunk': (effect, chunk) => {
            stdout.write(chunk);
            return more;
        },
        'confirm': async (effect, question, error) => {
            const confirm = await enquirer.prompt({
                type: 'confirm',
                name: 'confirm',
                message: question
            });
            rl.clearLine(0);
            if (!confirm) return error;
        },
        'help': () => {
            console.log(printPrompt(session) + printPrefix('help', COLOR.success) + ` You are in command-mode. Run \`${kitConfigs.talk.command}\` command and ask for help.`);
            return more;
        },
        'request-chat-completion': async (effect, request) => {
            const response = await openai.chat.completions.create(request);
            return response;
        },
        'send-log': (effect, ...args) => {
            console.log(printPrompt(session) + args.join(' '));
            return more;
        },
        'send-error': (effect, ...args) => {
            console.error(printPrompt(session) + printPrefix('error', COLOR.error) + ' ' + args.join(' '));
            return more;
        },
        'send-warning': (effect, ...args) => {
            console.warn(printPrompt(session) + printPrefix('warning', COLOR.warn) + ' ' + args.join(' '));
            return more;
        },
        'unhandled-tool-call': (effect, tool_call) => {
            console.warn(printPrompt(session) + printPrefix('error', COLOR.error) + ' ' + 'unhandled-tool-call', inspect(tool_call));
            return more;
        }
    };

    async function handleEffect(effect, ...args) {
        try {
            if (effect in replFx) {
                const sendLog = !(['send-chunk','get-input'].includes(effect) || config.quiet);
                const logText = printPrefix('repl.fx', COLOR.info) + ' ' + effect;
                if (sendLog) replFx['send-log'](effect, logText + ' start');
                const result = await replFx[effect](effect, ...args);
                if (sendLog) replFx['send-log'](effect, logText + ' end');
                return result;
            }
            for (const [ kitName, kitConfig ] of Object.entries(kitConfigs)) {
                if (kitConfig.disabled) continue;
                const kit = session.kits[kitName];
                if (effect in kit.fns) {
                    const logText = printPrefix(kitName + '.' + effect, COLOR.info);
                    await replFx['send-log'](effect, logText + ' start');
                    const fn = kit.fns[effect];
                    if (fn?.confirm) {
                        const error = await replFx.confirm(effect, `Are you sure you want to run ${kitName}.${effect} with ${JSON.stringify(args[1])}?`, `Aborted ${kitName}.${effect}.`);
                        if (error) return error;
                    }
                    const result = await kit.fns[effect](...args);
                    await replFx['send-log'](effect, logText + ' end');
                    return result;
                }
            }
        } catch (error) {
            return replFx['send-error'](effect, error.stack);
        }
    }

    await tryWithEffects(
        REPL(session),
        handleEffect,
        (error) => console.error(error.stack)
    );

    rl.close();
}

if (stdin.isTTY
    && import.meta.url.startsWith('file:')
    && realpathSync(argv[1]) === url.fileURLToPath(import.meta.url)
) {

    registerShutdown();

    (async () => {
        try {
            await main(env, argv.slice(2));
        } catch (error) {
            console.error(error.stack);
            shutdown(1, 'error');
        }
    })();

}
