import { printTeamRoster } from '../templates/index.js';

export default {
    impl(session, agent, { name, designation, description }) {
        // TODO: implement updating a team member
        return printTeamRoster(session, agent);
    },
    name: 'update_team_member',
    description: `Update a member of the team.`,
    parameters: {
        type: 'object',
        properties: {
            designation: {
                type: 'string',
                description: 'The official designation by which the team member will be referred. Must be unique amongst the team.'
            },
            name: {
                type: 'string',
                description: 'The name of the team member as they would be addressed informally by teammates.'
            },
            description: {
                type: 'string',
                description: 'A brief description of the team member and their role. Will be shown when viewing the team roster.'
            }
        },
        required: ['designation']
    }
};
