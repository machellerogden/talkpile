import os from 'node:os';
import process from 'node:process';
import c from 'chalk';
import meow from 'meow';
import merge from 'deepmerge';
import { printKV, printTable } from './print.js';
import { extractPassThroughArgs } from './input.js';
import { access, constants } from 'node:fs/promises';
import path from 'node:path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'node:url';
import { findUpSync, findUpMultiple } from 'find-up';
import { loadYamlFileSync } from './yaml.js';

const configFilename = '.talkpile.yml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const __package_root = path.dirname(findUpSync('package.json', { cwd: __dirname }));

async function canRead(filePath) {
    try {
        await access(filePath, constants.R_OK);
        return true;
    } catch {
        return false;
    }
}

function getUserConfigPath(filename, env, platform) {

    filename = filename ?? configFilename;
    env = env ?? process.env;
    platform = platform ?? process.platform;

    const home_dir = platform === 'win32' ? env.USERPROFILE : env.HOME;

    return path.resolve(home_dir, filename);
}

function getSystemConfigPath(filename, platform) {

    filename = filename ?? configFilename;
    platform = platform ?? process.platform;

    const etc_dir = platform === 'win32' ? 'C:\\ProgramData' : '/usr/local/etc';

    return path.resolve(etc_dir, filename);
}

async function findConfigSources(env, argv, cwd, filename, platform) {

    env = env ?? process.env;
    argv = argv ?? process.argv.slice(2);
    cwd = cwd ?? process.cwd();
    filename = filename ?? configFilename;

    // core config
    const packageConfigPath = path.resolve(__package_root, filename);

    // system-wide config
    const systemConfigPath = getSystemConfigPath(filename, platform);

    // user config
    const userConfigPath = getUserConfigPath(filename, env, platform);

    // current working directory and ancestor directory configs
    const upPaths = (await findUpMultiple(filename, { cwd })).reverse();

    const configPaths = [
        packageConfigPath,
        systemConfigPath,
        userConfigPath,
        ...upPaths
    ];

    const configSources = await configPaths.reduce(async (acc, path) => {
        const sources = await acc;
        if (!sources.includes(path) && await canRead(path)) {
            sources.push(path);
        }
        return sources;
    }, []);

    return configSources;
}

export async function getClientConfig(env, argv, cwd, platform) {

    env = env ?? process.env;
    argv = argv ?? process.argv.slice(2);
    cwd = cwd ?? process.cwd();
    platform = platform ?? process.platform;

    const configSources = await findConfigSources(env, argv, cwd, configFilename, platform);
    const configs = configSources.map(source => loadYamlFileSync(source));
    let config = configs.reduce((acc, config) => merge(acc, config), {});

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

    config.shell_user = shell_user;
    config.user = config.user ?? {};
    config.user.name = config.user.name ?? shell_user;
    config.user.location = config.user.location ?? 'Chicago, IL';

    const { input, flags, unnormalizedFlags } = meow(HELP_TEXT, {
        argv,
        importMeta: import.meta,
        booleanDefault: undefined,
        flags: {
            cwd: {
                type: 'string',
                default: cwd
            },
            name: {
                type: 'string',
                default: config.name ?? shell_user
            },
            location: {
                type: 'string',
                default: config.location ?? 'Chicago, IL'
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

    config = merge(config, flags);

    config.name = config.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    if (config.name.length > 64) config.name = config.name.slice(0, 64);

    if (config.debug) {
        console.log(printTable(config));
        if (config.verbose) {
            console.log('config sources:');
            console.log(configSources);
            console.log('configs:');
            console.log(configs);
        }
    }

    return config;
}

export async function getDaemonConfig(env, argv, cwd, platform) {

    const OPENAI_API_KEY = env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is not set.');

    env = env ?? process.env;
    argv = argv ?? process.argv.slice(2);
    cwd = cwd ?? process.cwd();
    platform = platform ?? process.platform;

    const configSources = await findConfigSources(env, argv, cwd, configFilename, platform);
    const configs = configSources.map(source => loadYamlFileSync(source));
    let config = configs.reduce((acc, config) => merge(acc, config), {});

    const HELP_TEXT = `
${c.cyan('Usage')}

NAME
     ${c.bold('talkpile-daemon')} - host piles of bots on your machine

SYNOPSIS
     talkpile-daemon

DESCRIPTION
     The talkpile-daemon command hosts talkpile on your machine.

`;

    const shell_user = os.userInfo().username;

    config.shell_user = shell_user;
    config.name = config.name ?? config.shell_user;
    config.location = config.location ?? 'Chicago, IL';

    const { input, flags, unnormalizedFlags } = meow(HELP_TEXT, {
        argv,
        importMeta: import.meta,
        booleanDefault: undefined,
        flags: {
            cwd: {
                type: 'string',
                default: cwd
            },
            name: {
                type: 'string',
                default: config.name ?? shell_user
            },
            location: {
                type: 'string',
                default: config.location ?? 'Chicago, IL'
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

    config = merge(config, flags);

    config.name = config.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    if (config.name.length > 64) config.name = config.name.slice(0, 64);

    if (config.debug) {
        console.log(printTable(config));
        if (config.verbose) {
            for (let i = 0; i < configs.length; i++) {
                console.log();
                console.log('Config loaded from:', configSources[i]);
                console.log(printTable(configs[i]));
            }
        }
    }

    config.port = 9393; // TODO

    return config;
}
