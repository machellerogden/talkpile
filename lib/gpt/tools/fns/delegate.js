export default {
    type: 'function',
    function: {
        name: 'delegate',
        description: 'Delegate tasks to members of your team.',
        parameters: {
            type: 'object',
            properties: {
                task: {
                    type: 'string',
                    description: 'The task to delegate.',
                    default: `This is a request from team member "${command}". User ${session.config.name} would like to chat. Please greet ${session.config.name}.`
                },
                assignee: {
                    type: 'string',
                    description: 'The team member to whom the task is being delegated.'
                }
            },
            required: ['task', 'assignee']
        }
    }
};
