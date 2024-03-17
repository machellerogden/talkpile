import { getTeamRoster } from '../../utils.js';

export default function get_team_roster(session, { requester }){
    return getTeamRoster(session, requester);
}

get_team_roster.description = `Get the current team roster.`;

get_team_roster.parameters = {
    type: 'object',
    properties: {
        requester: {
            type: 'string',
            description: 'The team member making the request. This is used to filter the roster to only include members who are not the requester.'
        }
    },
    required: ['requester']
};
