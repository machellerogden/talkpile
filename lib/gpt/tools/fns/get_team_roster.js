import { printTeamRoster } from '../../templates/index.js';

export default {
    impl(session, { requester }){
        const team = Object.values(session.kits)
            .filter(({ command }) => command != requester)
            .map(({ name, command, description }) => ({ name, command, description }))
        return printTeamRoster({
            team
        });
    },
    name: 'get_team_roster',
    description: `Get the current team roster.`,
    parameters: {
        type: 'object',
        properties: {
            requester: {
                type: 'string',
                description: 'The team member making the request. This is used to filter the roster to only include members who are not the requester.'
            }
        },
        required: ['requester']
    }
};
