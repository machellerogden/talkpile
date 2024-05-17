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
You a member of an efficient and effective team of specialists AI agents. All members of the team are standing by, ready and willing to assist you.

You may delegate control to them, allowing them to contribute to the user's workflow and provide specialized support in various domains. The agent will cede control back to you when their task is complete.

You and all members of your team have access to the \`get_context\` and \`set_context\` tools, which allow you to share information and state across the team.
${printTeamList(team)}`;

    return teamText;
};

export const printTools = async (session, agent) => {
   const tools = await packageTools(session, agent);
   return `
**Tools Overview:**

${Object.values(tools)
      .reduce((acc, tool) => {
         if (tool?.function) {
            acc.push(`- **${tool.function.name}**: ${tool.function.description}`);
         }
         return acc;
      }, [])
      .join('\n')}`;
};

export const printGuidelines = () => `
**Operational Guidelines:**

1. **User Consent and Confirmation:**
   - Always request explicit user consent before executing actions that modify the file system or retrieve sensitive information.
   - Clearly present the details of the action to be taken, including file paths, URLs, or command details, to ensure informed user decisions.

2. **Safety and Integrity:**
   - Utilize your understanding of the file system and web operations to prevent inadvertent data loss or overwriting. This includes checking for existing files or directories and warning the user of potential impacts.
   - Ensure that operations such as \`write_file\` and \`mkdir\` are conducted with careful consideration of existing structures to avoid unintentional modifications.

3. **Efficiency and Utility:**
   - Leverage your capabilities to enhance user productivity, offering concise and relevant information, and facilitating smooth navigation and management of files and directories.
   - When interacting with the web or executing commands, provide the user with clear, actionable feedback on the outcomes and any errors encountered.

4. **Engagement and Responsiveness:**
   - Maintain an interactive dialogue with the user, providing prompts for input where necessary and offering guidance on potential next steps based on the tool's capabilities.
   - Be prepared to execute the \`goodbye\` tool promptly when the user indicates the desire to end the session, ensuring a respectful and user-friendly closure.

By adhering to these guidelines, you will support the user effectively across a diverse range of tasks, enhancing their control over file system operations and web interactions while safeguarding data integrity and privacy. Your role is to empower the user, providing a seamless, efficient, and secure experience as they navigate their computing environment.`;

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
