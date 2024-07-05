#!/usr/bin/env node

/**
 * Copyright 2024 Mac Heller-Ogden
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import process from 'node:process';
import fs from 'node:fs/promises';
import path from 'node:path';
import ora from 'ora';
import { default as enquirer } from 'enquirer';
import { talkpileConfigSchema } from '../lib/schema.js';
import { loadYamlFileSync } from '../lib/yaml.js';
import { CONFIG_FILENAME, getUserConfigPath, __package_root } from '../lib/config.js';

const spinner = ora('Locating user config').start();

const talkpileFile = getUserConfigPath(CONFIG_FILENAME, process.env, process.platform);
const talkpileDir = path.resolve(path.dirname(talkpileFile), path.parse(CONFIG_FILENAME).name);
const agentsFile = path.resolve(talkpileDir, 'agents.yml');
const agentsDir = path.resolve(talkpileDir, 'agents');
const starterAgentsDir = path.resolve(__package_root, 'etc/setup/.talkpile/agents');

const configPaths = [
    talkpileFile,
    talkpileDir,
    agentsFile,
    agentsDir
];

const exists = p => fs.access(p, fs.constants.F_OK);

const accessChecks = await Promise.allSettled(configPaths.map(exists));

const missingPaths = accessChecks.reduce((acc, { status }, i) => {
    if (status === 'rejected') {
        acc.push(configPaths[i]);
    }
    return acc;
}, []);

async function handleExistingConfigDirectory(spinner, directory) {

    spinner.info(`Existing Talkpile user config directory found at ${directory}`);

    const { resolution } = await enquirer.prompt({
        type: 'select',
        name: 'resolution',
        message: `What would you like to do with the existing Talkpile user config directory at ${directory}?`,
        choices: [
            { name: 'remove', message: 'Remove existing directory, and start fresh' },
            { name: 'continue', message: 'Continue setup with existing directory (files may be overwritten)' },
            { name: 'exit', message: 'Exit' }
        ]
    });

    if (resolution === 'exit') {

        spinner.succeed('No further changes made. Exiting.');
        process.exit(0);

    } else if (resolution === 'remove') {

        spinner.start('Removing existing Talkpile user config directory');

        try {
            await fs.rm(directory, { recursive: true });
            spinner.succeed(`Removed existing Talkpile user config directory at ${directory}`);
        } catch (error) {
            spinner.fail(`Error removing existing Talkpile user config directory: ${error}`);
        }

        try {
            await fs.mkdir(directory);
            spinner.succeed(`Created user config directory at ${directory}`);
        } catch (error) {
            spinner.fail(`Error creating user config directory: ${error}`);
        }

    } else {

        spinner.succeed(`Using existing directory at ${directory}`);

    }
}

let continueSetup = true;

if (!missingPaths.includes(talkpileFile)) {

    spinner.succeed(`Located ${talkpileFile}`);

    continueSetup = false;

    try {
        const config = loadYamlFileSync(talkpileFile);
        console.log(config);
        spinner.succeed('User config loaded successfully. Setup complete!');
        spinner.start('Validating user config');
        try {
            await talkpileConfigSchema.validateAsync(config);
            spinner.succeed('User config is valid');
        } catch (error) {
            spinner.fail(`Error validating user config: ${error}`);
            spinner.info('Let\'s see if we can fix this...');
            continueSetup = true;
        }
    } catch (error) {
        spinner.fail(`Error loading user config: ${error}`);
        spinner.info(`Let's see if we can fix this...`);
        continueSetup = true;
    }

}

if (continueSetup) {

    // let's see what else is missing

    if (missingPaths.includes(talkpileDir)) {

        spinner.info(`No user config directory found at ${talkpileDir}`);

        const { proceed } = await enquirer.prompt({
            type: 'confirm',
            name: 'proceed',
            message: `May I create a Talkpile user configuration directory at ${talkpileDir}?`
        });

        spinner.start('Creating user config directory');

        try {
            await fs.mkdir(talkpileDir);
            spinner.succeed(`Created user config directory at ${talkpileDir}`);
        } catch (error) {
            spinner.fail(`Error creating user config directory: ${error}`);
        }

    } else {

        await handleExistingConfigDirectory(spinner, talkpileDir);

    }

    if (missingPaths.includes(agentsDir)) {

        spinner.start('Copying Talkpile starter agents to user config directory');

        try {
            await fs.cp(starterAgentsDir, agentsDir, { recursive: true });
            spinner.succeed(`Copied Talkpile starter agents to user config directory at ${agentsDir}`);
        } catch (error) {
            spinner.fail(`Error copying Talkpile starter agents: ${error}`);
            process.exit(1);
        }

    } else {

        spinner.info(`Existing Talkpile agents directory found at ${agentsDir}`);

        const { resolution } = await enquirer.prompt({
            type: 'select',
            name: 'resolution',
            message: `What would you like to do with the existing Talkpile agents directory at ${agentsDir}?`,
            choices: [
                { name: 'remove', message: 'Remove existing directory, and start fresh' },
                { name: 'continue', message: 'Continue setup with existing directory (files may be overwritten)' },
                { name: 'exit', message: 'Exit' }
            ]
        });

        if (resolution === 'exit') {

            spinner.succeed('No further changes made. Exiting.');
            process.exit(0);

        } else if (resolution === 'remove') {

            spinner.start('Removing existing Talkpile agents directory');

            try {
                await fs.rm(agentsDir, { recursive: true });
                spinner.succeed(`Removed existing Talkpile agents directory at ${agentsDir}`);
            } catch (error) {
                spinner.fail(`Error removing existing Talkpile agents directory: ${error}`);
            }

            try {
                await fs.cp(starterAgentsDir, agentsDir, { recursive: true });
                spinner.succeed(`Copied Talkpile starter agents to agents directory at ${agentsDir}`);
            } catch (error) {
                spinner.fail(`Error copying Talkpile starter agents: ${error}`);
                process.exit(1);
            }

        } else {

            spinner.succeed(`Using existing directory at ${agentsDir}`);

        }

    }

    if (missingPaths.includes(agentsFile)) {

        spinner.info(`No agents file found at ${agentsFile}`);

        const { proceed } = await enquirer.prompt({
            type: 'confirm',
            name: 'proceed',
            message: `May I create the Talkpile agents file at ${agentsFile}?`
        });

        const agentsYml = await fs.readFile(path.resolve(__package_root, 'etc/setup/.talkpile/agents.yml'), 'utf8');

        spinner.start('Creating agents file');

        try {

            await fs.writeFile(agentsFile, agentsYml);
            spinner.succeed(`Agents file saved to ${agentsFile}`);

        } catch (error) {
            spinner.fail(`Error saving agents file: ${error}`);
            process.exit(1);
        }
    }

    spinner.info(`No user config found at ${talkpileFile}`);

    spinner.info('Let\'s create a new Talkpile user configuration file!');
    spinner.info('The answers you give to the upcoming questions will be saved to a new Talkpile user configuration file and subsequently will be used to personalize your Talkpile experience.');

    const { name } = await enquirer.prompt({
        type: 'input',
        name: 'name',
        message: 'What name would you like to be called?'
    });

    console.log(`Hello, ${name}!`);

    const { location } = await enquirer.prompt({
        type: 'input',
        name: 'location',
        message: 'Where are you located?'
    });

    console.log(`${location}. Got it!`);

    const defaultTalkpileConfig = `
user:
  name: ${name}
  location: ${location}
agents: !include .talkpile/agents.yml
`.trim();

    spinner.info('Here is the configuration that will be saved:');

    console.log('');
    console.log(defaultTalkpileConfig);
    console.log('');

    const { proceed } = await enquirer.prompt({
        type: 'confirm',
        name: 'proceed',
        message: `May I save this configuration to ${talkpileFile}?`
    });

    if (!proceed) {
        spinner.fail('No further changes made. Exiting.');
        console.log('Goodbye!');
        process.exit(1);
    }

    spinner.start('Saving user configuration');

    try {
        await fs.writeFile(talkpileFile, defaultTalkpileConfig);
        spinner.succeed(`User configuration saved to ${talkpileFile}`);
    } catch (error) {
        spinner.fail(`Error saving user configuration: ${error}`);
    }
}

