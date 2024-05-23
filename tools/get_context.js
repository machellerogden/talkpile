export const handler = (session, agent) =>
    JSON.stringify(session.context, null, 2);
