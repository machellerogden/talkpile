import process from 'node:process';
import c from 'ansi-colors';
import os from 'node:os';
import enquirer from 'enquirer';
import { printKV } from './print.js';

import meow from 'meow';
import Conf from 'conf';
import merge from 'deepmerge';

export const HELP_TEXT = `
${c.cyan('Usage')}

    $ ${c.bold('talkpile')}
`;

const preferences = new Conf({
    projectName: 'talkpile',
    schema: {},
    encryptionKey: 'talkpile' // obscufate
});

const extractPassThrough = (argv) =>
    argv.reduce((a, v) => {
        if (Array.isArray(a)) a.push(v);
        if (v === '--') a = [];
        return a;
    }, null) ?? [];

export async function getConfig(env, argv) {
    env = env ?? process.env;
    argv = argv ?? process.argv.slice(2);

    const username = os.userInfo().username;

    const openaiApiKey = preferences.get('openaiApiKey', env.OPENAI_API_KEY);

    const { input, flags, unnormalizedFlags } = meow(HELP_TEXT, {
        argv,
        importMeta: import.meta,
        booleanDefault: undefined,
        flags: {
            name: {
                type: 'string',
                default: preferences.get('name', username)
            },
            debug: {
                type: 'boolean',
                default: false
            }
        }
    });

    const passthruInput = extractPassThrough(argv);

    for (const _ of passthruInput) input.pop();

    const customFlags = {};

    for (const key in unnormalizedFlags) {
        if (!(key in flags)) {
            customFlags[key] = unnormalizedFlags[key];
        }
    }

    const config = merge(preferences.store, flags);

    config.openaiApiKey = openaiApiKey;

    if (!config.openaiApiKey) {
        try {
            const prompt = new enquirer.Password({
                name: 'OPENAI_API_KEY',
                message: 'OpenAI API Key:'
            });
            config.openaiApiKey = await prompt.run();
        } catch (e) {
            console.error('Canceled.');
            throw e;
        }
    }

    config.username = username;

    config.name = config.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    if (config.name.length > 64) config.name = config.name.slice(0, 64);

    // !!! PERSIST
    preferences.store = config;

    if (config.debug) {
        console.log(printKV('preferences.path', preferences.path));
        for (const [k, v] of Object.entries(config)) {
            console.log(printKV(k, v));
        }
    }

    return config;
}
