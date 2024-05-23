import { printTeam } from '../lib/ai/templates.js';

export const handler = (session, agent) =>
    printTeam(session, agent);
