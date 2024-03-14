#!/usr/bin/env node

import * as readline from 'node:readline/promises';
import { realpathSync } from 'node:fs';
import { EOL } from 'node:os';
import * as url from 'node:url';
import process, { stdin, stdout, exit, env, argv } from 'node:process';
import { tryWithEffects, fx } from 'with-effects';
import OpenAI from 'openai';
import chalk from 'chalk';
import { Config } from '../lib/config.js';
import { editAsync } from 'external-editor';
import { printPrefix, COLOR, inspect } from '../lib/print.js';
import { GPT } from '../lib/gpt/index.js';
import * as coreKit from '../lib/gpt/kits/core.js';
import { exitSignal } from '../lib/exit.js';

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
            yield* GPT(session, coreKit);
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

    function shutdown(exitCode, signal) {
        console.log(EOL, `Received ${signal}. Shutting down.`);
        exitCode = exitCode ?? 0;
        if (typeof exitCode !== 'number') exitCode = 1;
        queueMicrotask(() => exit(exitCode));
    }

    exitSignal.addEventListener('abort', () => shutdown(0), { once: true });

    for (const signal of ['SIGHUP', 'SIGTERM', 'SIGINT', 'SIGBREAK', 'SIGABRT', 'SIGQUIT']) {
        process.on(signal, () => shutdown(0, signal));
    }

    process.on('uncaughtException', e => {
        console.error(e.stack);
        shutdown(1, 'uncaughtException');
    });

    process.on('unhandledRejection', e => {
        console.error(e.stack);
        shutdown(1, 'unhandledRejection');
    });

    try {

        await main(env, argv.slice(2));
    } catch (error) {
        console.error(error);
        shutdown(1);
    }
}
