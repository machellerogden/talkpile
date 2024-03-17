#!/usr/bin/env node

import * as readline from 'node:readline/promises';
import { realpathSync } from 'node:fs';
import { EOL } from 'node:os';
import * as url from 'node:url';
import process, { stdin, stdout, env, argv } from 'node:process';
import { tryWithEffects, fx } from 'with-effects';
import OpenAI from 'openai';
import { getConfig } from '../lib/config.js';
import { editAsync } from 'external-editor';
import { COLOR, printPrefix, printDefaultPrompt, inspect } from '../lib/print.js';
import { REPL } from '../lib/repl.js';
import { registerShutdown, shutdown } from '../lib/exit.js';
import { GPT } from '../lib/gpt/index.js';

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

    const context = {
        shell_user: config.shell_user,
        working_directory: config.cwd,
        geolocation: config.geolocation
    };

    // TODO
    // config can't hold functions because it's serialized to JSON.
    // we could save extra settings in a js file module and load
    // ... or prompt could be config of template string and template variables
    const prompt = config.prompt = typeof config.prompt === 'function'
        ? config.prompt
        : typeof config.prompt === 'string'
            ? () => config.prompt
            : printDefaultPrompt;

    const session = {
        config,
        context
    };

    const defaultKitConfigs = {
        'copilot': {
            command: 'gpt',
            import: '../lib/gpt/kits/copilot/index.js',
            model: 'gpt-4-0125-preview',
            temperature: 0.3,
            frequency_penalty: 0.2,
            presence_penalty: 0.2
        }
    };

    const kitConfigs = {
        ...defaultKitConfigs,
        ...(config.kits ?? {})
    };

    const delegates = {};

    for (const [ kitName, kitConfig ] of Object.entries(kitConfigs)) {
        if (kitConfig.disabled) continue;

        try {
            if (config.debug) console.log(`Loading Kit:`, kitName, kitConfig);
            const kitModule = await import(kitConfig.import);
            const kit = await kitModule.load(session, kitConfig);

            // GPT, I hereby appoint you as my delegate to be called upon when
            // the command is given. Know of this session and take with you the
            // tools in this kit. Go forth and do my bidding.
            delegates[kit.command] = GPT(session, kit);

        } catch (error) {
            console.error(`Error loading kit: ${kitName}`, error);
            continue;
        }
    }

    session.delegates = delegates;

    let more = true;

    const replFx = {
        'get-input': async (effect, question) => {
            question = question ?? prompt(session);
            const input = await rl.question(question);
            return input;
        },
        'get-editor-input': async (effect) => {
            const input = await edit('');
            return input;
        },
        'send-chunk': (effect, chunk) => {
            stdout.write(chunk);
            return more;
        },
        'help': (effect, ...args) => {
            console.log(printPrefix('help', COLOR.success) + `You are in command-mode. Run \`${copilot.command}\` command first, and then ask for help.`);
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
