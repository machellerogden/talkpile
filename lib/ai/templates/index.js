import { packageTools } from '../index.js';
import { core as coreTools } from '../tools/index.js';

export const printIntro = (session, agent) => `
Your official designation is \`${agent.designation}\`. The user and your other teammates may use this designation to summon you and request your assistance.${agent.designation == agent.name ? '' : ` Informally, you are also known as **${agent.name}**.`}

${agent.instructions}`;

export const printTeamList = (team) => {
    if (team.length === 0) return '';

    const teamText = `
**Your Team:**

${team.map(({ name, designation, description }) => `- **${designation}**: Also known as ${name}. ${description}`).join('\n')}`;

    return teamText;
}

export const printTeamRoster = (session, agent) => {

    const team = Object.values(session.agents)
        .filter(({ designation }) => designation != agent.designation)
        .map(({ name, designation, description }) => ({ name, designation, description }))

    const teamText = `
You are a member of an efficient and effective team of specialists. All members of the team are standing by, ready and willing to assist you.

    Gather input from your teammates with the one-shot \`message_team_member\` function. Use the \`delegate\` function to temporarily hand-off control over the user's session to a teammate. This allows that agent to then interact directly work with the user to contribute to the user's workflow and provide specialized support. Prefer \`message_team_member\` when you are trying to coordinate work amongst the team because it will allow you to retain control. When you delegate to an agent, the agent will cede control back to you only after they have interacted with the user so avoid delegating when trying to work autonomously. When delegating, note that the assigned teammate's interaction's with the user will not be visible to you, though the agent should provide you a summary of the engagement with the user if/when they give back control.

You and all members of your team have access to the \`get_context\` and \`set_context\` tools, which allow you to share information and state across the team.
${printTeamList(team)}`;

    return teamText;
};

export const printTools = async (session, agent) => {
   const tools = await packageTools(session, agent);
   return `
**Your Tools:**

${Object.values(tools)
      .reduce((acc, tool) => {
         if (tool?.function) {
            acc.push(`- **${tool.function.name}**: ${tool.function.description}`);
         }
         return acc;
      }, [])
      .join('\n')}`;
};

export const printFooter = (session, agent) => `

**Important Context:**

Current system time is ${new Date().toLocaleString()}.

Take note of key data in this session's context:

\`\`\`json
${JSON.stringify(session.context, null, 2)}
\`\`\`

${agent.postscript ?? ''}
`.trim();

export async function printHeader(session, agent) {
   return `
${await printIntro(session, agent)}
${await printTeamRoster(session, agent)}
${await printTools(session, agent)}
`.trim();
}
