import { packageAgents, packageDelegates } from '../index.js';
import { printTeamRoster } from '../templates/index.js';

import Conf from 'conf';

// temp hack to avoid circular dependency
const builtinToolNames = [
    'add_team_member',
    'fetch_webpage',
    'mkdir',
    'open',
    'pwd',
    'read_dir',
    'read_file',
    'remove_team_member',
    'shell_exec',
    'update_team_member',
    'write_file',
];

export default {
    async impl(session, agent, { name, designation, description, instructions, tools, temperature, frequency_penalty, presence_penalty }) {

        const agentsConfig = session.config.settings.get('agents');

        const newAgent = {};

        newAgent.designation = designation;
        newAgent.name = name ?? designation;

        if (description) newAgent.description = description;
        if (instructions) newAgent.instructions = instructions;

        newAgent.temperature = temperature ?? 0.3;
        newAgent.frequency_penalty = frequency_penalty ?? 0.2;
        newAgent.presence_penalty = presence_penalty ?? 0.1;
        newAgent.postscript = '';

        agentsConfig[designation] = newAgent;

        console.log('********************************************************************************');
        console.log('Adding team member:', newAgent);
        console.log('********************************************************************************');

        session.config.agents = agentsConfig;
        session.config.settings.set('agents', session.config.agents);

        // repackage agents and delegates
        session.agents = await packageAgents(session);
        session.delegates = await packageDelegates(session);

        return `Added team member: ${designation}

${printTeamRoster(session, agent)}`;
    },
    name: 'add_team_member',
    description: `Add new member to the team.`,
    parameters: {
        type: 'object',
        properties: {
            designation: {
                type: 'string',
                description: 'The official designation by which the team member will be referred. Must be unique amongst the team.'
            },
            name: {
                type: 'string',
                description: 'The name of the team member as they would be addressed informally by teammates. Defaults to the designation.'
            },
            description: {
                type: 'string',
                description: 'A brief description of the team member and their role. Will be shown when viewing the team roster.'
            },
            instructions: {
                type: 'string',
                description: 'Instructions for the team member. Can include orientation about their role on the team, special capabilities or any desired custom instruction.'
            },
            postscript: {
                type: 'string',
                description: 'Additional instruction text to will be presented to the agent immediately before they engage the user. Useful for providing for reminders and/or highlighting the most important aspects of the agent\'s broader instructions. For example: "IMPORTANT: Remember to talk like a pirate!"',
                default: ''
            },
            temperature: {
                type: 'number',
                description: 'The temperature to use when generating responses.',
                default: 0.3
            },
            tools: {
                type: 'array',
                items: {
                    enum: builtinToolNames
                },
                description: 'Set of tools to make available to the team member.'
            },
            frequency_penalty: {
                type: 'number',
                description: 'The frequency penalty to use when generating responses.',
                default: 0.2
            },
            presence_penalty: {
                type: 'number',
                description: 'The presence penalty to use when generating responses.',
                default: 0.1
            }
        },
        required: ['designation']
    }
};
