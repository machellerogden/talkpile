import { packageAgents, packageDelegates } from '../index.js';
import { printTeamRoster } from '../templates/index.js';

export default {
    async impl(session, agent, { designation }) {
        const agentsConfig = session.config.settings.get('agents');

        if (!(designation in agentsConfig)) {

            console.log('********************************************************************************');
            console.log('Team member not found:', designation);
            console.log('********************************************************************************');

            return `Team member not found: ${designation}

${printTeamRoster(session, agent)}`;
        }
        delete agentsConfig[designation];
        session.config.settings.set('agents', agentsConfig);

        // repackage agents and delegates
        session.agents = await packageAgents(session);
        session.delegates = await packageDelegates(session);

        return `Removed team member: ${designation}

${printTeamRoster(session, agent)}`;

    },
    name: 'remove_team_member',
    description: `Remove a member of the team.`,
    parameters: {
        type: 'object',
        properties: {
            designation: {
                type: 'string',
                description: 'The designation string of the team member to remove.'
            }
        },
        required: ['designation']
    }
};
