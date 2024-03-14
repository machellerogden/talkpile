#!/usr/bin/env node

import * as readline from 'node:readline/promises';
import { realpathSync } from 'node:fs';
import { EOL } from 'node:os';
import * as url from 'node:url';
import process, { stdin, stdout, exit, env, argv } from 'node:process';
import { tryWithEffects, fx } from 'with-effects';
import OpenAI from 'openai';
import { Config } from '../lib/config.js';
import { editAsync } from 'external-editor';
import { printPrefix, COLOR, inspect } from '../lib/print.js';
import { REPL } from '../lib/repl.js';
import { registerShutdown } from '../lib/exit.js';

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
    const config = Config(env, args);

    if (env.OPENAI_API_KEY == null) {
        throw Error('Missing OPENAI_API_KEY');
    }

    const rl = readline.createInterface({
        input: stdin,
        output: stdout
    });

    const openai = new OpenAI({
        apiKey: env.OPENAI_API_KEY
    });

    const session = {
        ...config,
        openai
    };

    let more = true;

    await tryWithEffects(
        REPL(session),
        {
            'get-input': async (effect, question = printPrefix(session.name ?? 'user')) => {
                const input = await rl.question(question);
                return input;
            },
            'get-editor-input': async (effect, question = printPrefix(session.name ?? 'user')) => {
                const input = await edit('');
                return input;
            },
            'send-chunk': (effect, chunk) => {
                stdout.write(chunk);
                return more;
            },
            'send-log': (effect, ...args) => {
                console.log(printPrefix('log', COLOR.info) + args.join(' '));
                return more;
            },
            'send-error': (effect, ...args) => {
                console.error(printPrefix('error', COLOR.error) + args.join(' '));
                return true;
            },
            'send-warning': (effect, ...args) => {
                console.warn(printPrefix('warning', COLOR.warn) + args.join(' '));
                return true;
            },
            'unhandled-tool-call': (effect, tool_call) => {
                console.log(inspect(tool_call));
                return true;
            }
        },
        (error) => console.error(error)
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
        console.error(error);
        shutdown(1);
    }

}
