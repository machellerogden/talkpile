export default (session, agent) => ({
    name: 'delegate',
    description: 'Delegate control to members of your team.',
    parameters: {
        type: 'object',
        properties: {
            message: {
                type: 'string',
                description: 'A message to share with team_member when delegating control of the conversation. Remember your teammate may only have the context you provide here. When the team member ends the conversation control will cede back to you -- remind the teammate of this in your message.',
                default: `Hello from your teammate, ${agent.designation}! Messages after this will be from the user, ${session.config.name}. I'm handing off control of this user session to you temporarily. When you end the conversation it will return to me. The user would like to know today's weather forecast for Chicago, IL. Please assist with this request. Do not delegate control to another team member.`
            },
            team_member: {
                type: 'string',
                description: 'The team member to whom control is being delegated.'
            }
        },
        required: ['message', 'team_member']
    }
});
