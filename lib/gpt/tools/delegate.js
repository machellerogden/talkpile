export default (session, agent) => ({
    name: 'delegate',
    description: 'Delegate tasks to members of your team.',
    parameters: {
        type: 'object',
        properties: {
            task: {
                type: 'string',
                description: 'The task to delegate.',
                default: `This is a request from ${agent.designation}. Please greet ${session.config.name}.`
            },
            assignee: {
                type: 'string',
                description: 'The team member to whom the task is being delegated.'
            }
        },
        required: ['task', 'assignee']
    }
});
