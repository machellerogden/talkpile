import open from 'open';

export default {
    async impl(session, agent, { target }) {
        await open(target);
        return 'Opened ' + target;
    },
    name: 'open',
    description: 'Open stuff for the user. URLs, files, executables.',
    properties: {
        target: {
            type: 'string',
            description: `The thing you want to open. Can be a URL, file, or executable. Opens in the default app for the file type. For example, URLs opens in your default browser.`
        }
    }
};
