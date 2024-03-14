import process from 'node:process';
import { inspect } from 'node:util';
import chalk from 'chalk';
import chalkTemplate from 'chalk-template';
import os from 'node:os';

import meow from 'meow';
import Conf from 'conf';
import merge from 'deepmerge';

export const HELP_TEXT = chalkTemplate`
{cyan Usage}

    $ {bold talkpile}
`;

const preferences = new Conf({
    projectName: 'talkpile',
    schema: {}
});

const extractPassThrough = argv => argv.reduce((a, v) => {
    if (Array.isArray(a)) a.push(v);
    if (v === '--') a = [];
    return a;
}, null) ?? [];

export function Config(env, argv, username) {

    env = env ?? process.env;
    argv = argv ?? process.argv.slice(2);
    username = username ?? os.userInfo().username;

    const { input, flags, unnormalizedFlags: rawFlags } = meow(HELP_TEXT, {
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

    for (const key in rawFlags) {
        if (!(key in flags)) {
            customFlags[key] = rawFlags[key];
        }
    }

    const config = preferences.store = merge(preferences.store, flags);

    if (config.name?.length > 0) {
        // OpenAI name restrictions
        config.name = config.name.replace(/[^a-zA-Z0-9_-]/g, '_');
        if (config.name.length > 64) config.name = config.name.slice(0, 64);
    }

    console.log(chalk.dim(`Config`.padEnd(16, ' ')), chalk.cyan(preferences.path));

    if (config.debug) console.log(inspect(config, { colors: true, depth: null }));

    return config;
}
