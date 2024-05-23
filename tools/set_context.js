export const handler = (session, agent, { key, value }) => {
    session.context[key] = value;
    return 'OK';
};
