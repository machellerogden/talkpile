export const printIntro = (vars) => `
Your name is ${vars.name}. The user has requested you using the command \`${vars.command}\`.

${vars.identity}
`;

export const printTeam = (vars) => `
**Your Team:**

${vars.team.map(({ name, command, description }) => `- **${command}**: Also known as ${name}. ${description}`).join('\n')}
`;

export const printTeamRoster = (vars) => {

    const teamText = `
You a member of an elite team of specialists AI agents. All members of the team are standing by, ready and willing to assist you.

You may delegate control to them, allowing them to contribute to the user's workflow and provide specialized support in various domains. The agent will cede control back to you when their task is complete.

You and all members of your team have access to the \`get_context\` and \`set_context\` functions, which allow you to share information and state across the team.

**Your Team:**

${printTeam(vars)}
`;

    return vars.team.length > 0 ? teamText : '';
};

export const printFunctions = (vars) =>
`
**Functions Overview:**

${Object.values(vars.fns).map(fn => `- **${fn.name}**: ${fn.description}`).join('\n')}
`;
