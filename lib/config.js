import os from 'node:os';
import process from 'node:process';

import Conf from 'conf';
import c from 'chalk';
import enquirer from 'enquirer';
import envPaths from 'env-paths';
import meow from 'meow';
import merge from 'deepmerge';

import { printKV, printTable } from './print.js';
import { extractPassThroughArgs } from './input.js';

const projectName = 'talkpile';

const defaultAgentConfigs = {
    "talkpile": {
        "name": "Talkpile",
        "designation": "talkpile",
        "import": "./loaders/lead.js",
        "model": "gpt-4o",
        "temperature": 0.4,
        "frequency_penalty": 0.1,
        "presence_penalty": 0.2
    },
    "hr": {
        "name": "Bob Porter",
        "designation": "hr",
        "import": "./loaders/contributor.js",
        "tools": [
            "add_team_member",
            "update_team_member",
            "remove_team_member"
        ],
        "description": "Responsible for updating the Talkpile team roster",
        "instructions": "You are responsible for managing the agents on the talkpile team. Review your intended changes with the user and use the following commands to review and to make changes to the team:\n\n- `get_team_roster`\n- `add_team_member`\n- `update_team_member`\n- `remove_team_member`",
        "postscript": "",
        "temperature": 0.3,
        "frequency_penalty": 0.2,
        "presence_penalty": 0.1
    },
};

export async function getClientConfig(env, argv, paths) {

    env = env ?? process.env;
    argv = argv ?? process.argv.slice(2);
    paths = paths ?? envPaths(projectName);

    // load settings from config file
    const settings = new Conf({
        projectName,
        schema: {},
        cwd: paths.config // explicitly set the config directory even though it's the default to ensure consistency with path handling
    });

    const HELP_TEXT = `
${c.cyan('Usage')}

NAME
     ${c.bold(projectName)} - talk to piles of bots

SYNOPSIS
     ${projectName}

DESCRIPTION
     The ${projectName} command is a hackable agentic REPL.

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
                default: false,
                shortFlag: 'q'
            },
            debug: {
                type: 'boolean',
                default: false
            },
            verbose: {
                type: 'boolean',
                default: false
            },
            host: {
                type: 'string',
                default: '127.0.0.1'
            },
            port: {
                type: 'number',
                default: 9393
            }
        }
    });

    if (input.at(0) === 'settings') {
        console.log(printKV('settings.path', settings.path));
        process.exit(0);
    }

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

    config.settings = settings;
    config.shell_user = shell_user;

    config.name = config.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    if (config.name.length > 64) config.name = config.name.slice(0, 64);

    config.agents = merge(defaultAgentConfigs, config.agents ?? {});

    if (config.debug) {
        console.log(printKV('settings.path', settings.path));
        console.log(printTable(config));
    }

    return config;
}

export async function getDaemonConfig(env, argv, paths) {

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
     ${c.bold(projectName)} - talk to piles of bots

SYNOPSIS
     ${projectName}

DESCRIPTION
     The ${projectName} command is a hackable agentic REPL.

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
                default: false,
                shortFlag: 'q'
            },
            debug: {
                type: 'boolean',
                default: false
            },
            verbose: {
                type: 'boolean',
                default: false
            }
        }
    });

    if (input.at(0) === 'settings') {
        console.log(printKV('settings.path', settings.path));
        process.exit(0);
    }

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

    config.settings = settings;
    config.shell_user = shell_user;

    config.name = config.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    if (config.name.length > 64) config.name = config.name.slice(0, 64);

    config.agents = merge(defaultAgentConfigs, config.agents ?? {});

    if (config.debug) {
        console.log(printKV('settings.path', settings.path));
        console.log(printTable(config));
    }

    // TODO
    config.port = 9393;

    return config;
}
