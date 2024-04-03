export default {
    impl(session) {
        return JSON.stringify(session.context, null, 2);
    },
    name: 'get_context',
    description: `Get the current context data for this session. Current user, current working directory, user's geographic location, and more.`
};
