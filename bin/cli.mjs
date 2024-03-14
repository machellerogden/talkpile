#!/usr/bin/env node

import * as readline from 'node:readline/promises';
import { realpathSync } from 'node:fs';
import { EOL } from 'node:os';
import * as url from 'node:url';
import { stdin, stdout, exit, env, argv } from 'node:process';
import { tryWithEffects, fx } from 'with-effects';
import OpenAI from 'openai';
import chalk from 'chalk';
import { inspect } from 'node:util';
import { Config } from '../lib/config.mjs';
import { editAsync } from 'external-editor';
import { printPrefix, COLOR } from '../lib/print.mjs';
import { GPT } from '../lib/gpt.mjs';

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

async function* REPL(session) {
    let input;
    repl: while (true) {
        input = yield fx('get-input');
        if (input === 'editor') input = yield fx('get-editor-input');
        if (input === 'q') {
            break repl;
        } else if (input === 'gpt') {
            yield* GPT(session);
        } else {
            yield fx('send-error', 'Unknown command:', input);
        }
    }
}

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
                const input = await edit(EOL + EOL + '# Please write your text above.');
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
                console.log(inspect(tool_call, { depth: null, colors: true }));
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
    try {
        await main(env, argv.slice(2));
    } catch (error) {
        console.error(error);
        exit(1);
    }
}
