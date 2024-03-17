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
import * as coreFns from '../lib/gpt/tools/core.js';

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

    const prefixes = [];

    const session = {
        config,
        context,
        prefixes
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

    session.kits = {};

    const delegates = {};

    for (const [ kitName, kitConfig ] of Object.entries(kitConfigs)) {
        if (kitConfig.disabled) continue;

        try {
            if (config.debug) console.log(`Loading Kit:`, kitName, kitConfig);
            const kitModule = await import(kitConfig.import);
            const kit = session.kits[kitName] = await kitModule.load(session, kitConfig);
            kit.fns = Object.assign(kit.fns, coreFns);

            // GPT, I hereby appoint you as my delegate to be called upon when
            // the command is given. Know of this session and take with you the
            // tools in this kit. Go forth and do my bidding.
            delegates[kit.command] = async (task) => {
                task = task ?? `This is a request from team member "${kit.command}". User ${config.name} would like to chat. Please greet ${config.name}.`;
                console.log(printPrefix('delegate', COLOR.info) + `Calling ${kit.command} delegate with task:`, task);
                return GPT(session, kit, { role: 'system', content: task });
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
            console.warn('unhandled-tool-call', inspect(tool_call));
            return more;
        }
    };

    async function handleEffect(effect, ...args) {
        if (effect in replFx) {
            const result = await replFx[effect](effect, ...args);
            if (config.debug) console.log('replFx', { effect, args, result });
            return result;
        }
        for (const [ kitName, kitConfig ] of Object.entries(kitConfigs)) {
            if (kitConfig.disabled) continue;
            const kit = session.kits[kitName];
            if (effect in kit.fns) {
                const result = await kit.fns[effect](...args);
                if (config.debug) console.log('kit.fns', { kit: kitName, effect, args, result });
                return result;
            }
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
