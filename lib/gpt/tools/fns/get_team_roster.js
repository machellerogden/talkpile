import { printTeamRoster } from '../../templates/index.js';

export default {
    impl(session, { requester }){
        return printTeamRoster(session, { command: requester });
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
