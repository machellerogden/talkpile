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

const settings = new Conf({
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

    if (settings.get('name') == null) {
        try {
            const prompt = new enquirer.Snippet({
                name: 'username',
                message: 'Settings',
                required: true,
                fields: [
                    {
                        name: 'name',
                        message: `Your name as displayed in chat mode and as submitted to APIs`
                    },
                    {
                        name: 'geolocation',
                        message: 'Location (e.g. "Chicago, IL")'
                    }
                ],
                template: `
{
     "name": "\${name}",
     "geolocation": "\${geolocation}"
}
                `.trim()
            });

            settings.store = (await prompt.run()).values;
        } catch (e) {
            console.error('Canceled.');
            throw e;
        }
    }

    const shell_user = os.userInfo().username;

    const OPENAI_API_KEY = env.OPENAI_API_KEY;

    const { input, flags, unnormalizedFlags } = meow(HELP_TEXT, {
        argv,
        importMeta: import.meta,
        booleanDefault: undefined,
        flags: {
            cwd: {
                type: 'string',
                default: process.cwd()
            },
            name: {
                type: 'string',
                default: settings.get('name', shell_user)
            },
            geolocation: {
                type: 'string',
                default: settings.get('geolocation', 'Chicago, IL')
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

    const config = merge(settings.store, flags);

    config.shell_user = shell_user;

    config.name = config.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    if (config.name.length > 64) config.name = config.name.slice(0, 64);

    if (config.debug) {
        console.log(printKV('settings.path', settings.path));
        for (const [k, v] of Object.entries(config)) {
            console.log(printKV(k, v));
        }
    }

    config.OPENAI_API_KEY = OPENAI_API_KEY;

    if (!config.OPENAI_API_KEY) {
        try {
            const prompt = new enquirer.Password({
                name: 'OPENAI_API_KEY',
                message: 'OpenAI API Key:'
            });
            config.OPENAI_API_KEY = await prompt.run();
        } catch (e) {
            console.error('Canceled.');
            throw e;
        }
    }


    return config;
}
