import { printHeader, printFooter } from './templates.js';

export async function loadAgent(session, agentConfig) {
    const agent = {};

    agent.designation = agentConfig.designation;
    agent.name = agentConfig.name ?? agentConfig.designation;
    agent.description = agentConfig.description ?? `Talkpile agent.`;
    agent.instructions = agentConfig.instructions ??
`As an AI agent embedded in a command-line interface (CLI) tool, you serve as a ` +
`dynamic copilot assisting users with a wide range requests.`;
    agent.provider = 'openai';
    agent.model = agentConfig.model ?? 'gpt-4o';
    agent.temperature = agentConfig.temperature ?? 0.3;
    agent.frequency_penalty = agentConfig.frequency_penalty ?? 0.2;
    agent.presence_penalty = agentConfig.presence_penalty ?? 0.2;
    agent.tools = agentConfig.tools ?? [];

    agent.getPrelude = async (session, agent) => [
        {
            role: 'system',
            content: `
${await printHeader(session, agent)}

**Lessons Learned From Previous Sessions:**

- **Weather**: Always use "https://wttr.in/" when you need the check the weather.
- **$HOME**: Instead of \`~\`, always use \`$HOME\` when referring to the user's home directory.
- **delegate vs. message_team_member**: Prefer \`message_team_member\` function for gathering input from other team members without involving the user. Use of \`delegate\` forces the user to become involved. Use \`delegate\` only when you want to hand over the user's engagement to another member of the team. Note that you will not be able to take back control once you delegate a task to another team member, rather, the other team member has to explicitly hand back control to you. Delegated team members usually require user engagement before they cede control.
${await printFooter(session, agent)}
`.trim()
        }
    ];

    agent.tools = agentConfig.tools ?? [];

    return agent;
}