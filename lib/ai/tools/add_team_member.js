import { packageAgents, packageDelegates } from '../index.js';
import { printTeamRoster } from '../templates/index.js';

import Conf from 'conf';

// temp hack to avoid circular dependency
const builtinToolNames = [
    'pwd',
    'mkdir',
    'read_dir',
    'read_file',
    'write_file',
    'fetch_webpage',
    'shell_exec',
    'add_team_member',
    'remove_team_member',
    'update_team_member'
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

        session.config.settings.set('agents', agentsConfig);

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
