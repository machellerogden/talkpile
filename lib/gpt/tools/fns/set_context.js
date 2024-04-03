export default {
    impl(session, { key, value }){
        session.context[key] = value;
        return 'OK';
    },
    name: 'set_context',
    description: `Set a context variable for this session. This can be used to store data that can be used later in the session.`,
    parameters: {
        type: 'object',
        properties: {
            key: {
                type: 'string',
                description: 'The key to use for the context variable.'
            },
            value: {
                type: 'string',
                description: 'The value to store in the context variable.'
            }
        },
        required: ['key', 'value']
    }
};
