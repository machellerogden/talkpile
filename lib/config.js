import os from 'node:os';
import process from 'node:process';

import Conf from 'conf';
import c from 'ansi-colors';
import enquirer from 'enquirer';
import envPaths from 'env-paths';
import meow from 'meow';
import merge from 'deepmerge';

import { printKV, printTable } from './print.js';
import { extractPassThroughArgs } from './input.js';


export async function getConfig(env, argv, paths) {

    const projectName = 'talkpile';

    env = env ?? process.env;
    argv = argv ?? process.argv.slice(2);
    paths = paths ?? envPaths(projectName);

    // for now, you must set this in your environment
    const OPENAI_API_KEY = env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is not set.');

    // load settings from config file
    const settings = new Conf({
        projectName,
        schema: {},
        cwd: paths.config // explicitly set the config directory even though it's the default to ensure consistency with path handling
    });

    const HELP_TEXT = `
${c.cyan('Usage')}

NAME
     ${c.bold('talkpile')} - talk to piles of bots

SYNOPSIS
     talkpile

DESCRIPTION
     The talkpile command is a hackable agentic REPL.

`;

    const shell_user = os.userInfo().username;

    if (settings.get('name') == null) {
        try {
            const prompt = new enquirer.Snippet({
                name: 'username',
                message: 'Settings',
                required: true,
                fields: [
                    {
                        name: 'shell_user',
                        message: shell_user
                    },
                    {
                        name: 'name',
                        message: `How would you like to be addressed?`
                    },
                    {
                        name: 'geolocation',
                        message: `Location (e.g. "Chicago, IL")`
                    }
                ],
                template: `
{
    "shell_user": "\${shell_user}",
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

    // get CLI options
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
            quiet: {
                type: 'boolean',
                default: false
            },
            debug: {
                type: 'boolean',
                default: false
            }
        }
    });

    // handle passthrough args
    const passthruInput = extractPassThroughArgs(argv);

    for (const _ of passthruInput) input.pop();

    // handle unnormalized flags
    const customFlags = {};

    for (const key in unnormalizedFlags) {
        if (!(key in flags)) {
            customFlags[key] = unnormalizedFlags[key];
        }
    }

    const config = merge(settings.store, flags);

    config.paths = paths;
    config.shell_user = shell_user;

    config.name = config.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    if (config.name.length > 64) config.name = config.name.slice(0, 64);

    if (config.debug) {
        console.log(printKV('settings.path', settings.path));
        console.log(printTable(config));
    }

    config.OPENAI_API_KEY = OPENAI_API_KEY;

    return config;
}
