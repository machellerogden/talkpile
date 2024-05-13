export default {
    impl(session, agent) {
        return 'OK. Proceed with final message to user.';
    },
    name: 'goodbye',
    description: 'IMMEDIATELY call this tool when the user wants to end the chat.'
};
