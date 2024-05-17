export default (session, agent) => ({
    name: 'delegate',
    description: 'Delegate control to members of your team.',
    parameters: {
        type: 'object',
        properties: {
            message: {
                type: 'string',
                description: 'A message to share with assignee when delegating control of the conversation. Remember your team member may only have the context you provide here. When the assignee ends the conversation control will cede back to you -- remind the assignee of this in your message.',
                default: `This message is from ${agent.designation}. Messages after this first message will be from ${session.config.name}. I'm delegating control of this user session to you temporarily. When you end the conversation it will return to me. Here is the user's request: What's the weather like in Chicago, IL today?`
            },
            assignee: {
                type: 'string',
                description: 'The team member to whom control is being delegated.'
            }
        },
        required: ['message', 'assignee']
    }
});
