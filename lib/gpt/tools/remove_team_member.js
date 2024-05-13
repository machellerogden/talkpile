import { printTeamRoster } from '../templates/index.js';

export default {
    impl(session, agent, { designation }) {
        // TODO: implement removing a team member
        return printTeamRoster(session, agent);
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
