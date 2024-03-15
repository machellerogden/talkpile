#!/usr/bin/env node

import * as readline from 'node:readline/promises';
import { realpathSync } from 'node:fs';
import { EOL } from 'node:os';
import * as url from 'node:url';
import process, { stdin, stdout, exit, env, argv } from 'node:process';
import { tryWithEffects, fx } from 'with-effects';
import OpenAI from 'openai';
import { getConfig } from '../lib/config.js';
import { editAsync } from 'external-editor';
import { printPrefix, COLOR, inspect } from '../lib/print.js';
import { REPL } from '../lib/repl.js';
import { registerShutdown, shutdown } from '../lib/exit.js';
import { GPT } from '../lib/gpt/index.js';
import * as copilotKit from '../lib/gpt/kits/copilot/index.js';

const edit = async (text) => new Promise((resolve, reject) => {
    try {
        editAsync(text, (error, value) => {
            if (error) return reject(error);
            resolve(value);
        });
    } catch (error) {
        reject(error);
    }
});

async function main(env = env, args = argv.slice(2)) {

    const config = await getConfig(env, args);

    const rl = readline.createInterface({
        input: stdin,
        output: stdout
    });

    const openai = new OpenAI({
        apiKey: config.openaiApiKey
    });

    const session = {
        config,
        openai
    };

    const copilot = await copilotKit.load(session, config.copilot);

    const delegates = {
        [copilot.name]: GPT(session, copilot)
    };

    session.delegates = delegates;

    let more = true;

    const replFx = {
        'get-input': async (effect, question = printPrefix(session.config.name ?? 'user')) => {
            const input = await rl.question(question);
            return input;
        },
        'get-editor-input': async (effect, question = printPrefix(session.config.name ?? 'user')) => {
            const input = await edit('');
            return input;
        },
        'send-chunk': (effect, chunk) => {
            stdout.write(chunk);
            return more;
        },
        'help': (effect, ...args) => {
            console.log(printPrefix('help', COLOR.success) + `You are in command-mode. Run \`${copilot.name}\` command first, and then ask for help.`);
            return more;
        },
        'request-chat-completion': async (effect, request) => {
            const response = await openai.chat.completions.create(request);
            return response;
        },
        'send-log': (effect, ...args) => {
            console.log(printPrefix('log', COLOR.info) + args.join(' '));
            return more;
        },
        'send-error': (effect, ...args) => {
            console.error(printPrefix('error', COLOR.error) + args.join(' '));
            return more;
        },
        'send-warning': (effect, ...args) => {
            console.warn(printPrefix('warning', COLOR.warn) + args.join(' '));
            return more;
        },
        'unhandled-tool-call': (effect, tool_call) => {
            console.log(inspect(tool_call));
            return more;
        }
    };

    async function handleEffect(effect, ...args) {
        if (effect in replFx) {
            const result = await replFx[effect](effect, ...args);
            if (config.debug) console.log('replFx', { effect, args, result });
            return result;
        }
        if (effect in copilot.fns) {
            const result = await copilot.fns[effect](...args);
            if (config.debug) console.log('copilot.fns', { effect, args, result });
            return result;
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

    try {
        await main(env, argv.slice(2));
    } catch (error) {
        console.error(error.stack);
        shutdown(1, 'error');
    }

}
