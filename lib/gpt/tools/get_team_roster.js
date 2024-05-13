import { printTeamRoster } from '../templates/index.js';

export default {
    impl(session, agent) {
        return printTeamRoster(session, agent);
    },
    name: 'get_team_roster',
    description: `Get the current team roster.`,
    parameters: {}
};
