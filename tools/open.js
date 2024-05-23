import open from 'open';

export const handler = async (session, agent, { target }) => {
    await open(target);
    return 'Opened ' + target;
};
