import { printHeader, printGuidelines, printFooter } from '../templates/index.js';

export async function load(session, agentConfig) {
    const agent = {};

    agent.designation = agentConfig.designation;
    agent.name = agentConfig.name ?? agentConfig.designation;
    agent.description = agentConfig.description ?? `Talkpile team leader, and the user's primary interface to the Talkpile system.`;
    agent.instructions = agentConfig.instructions ??
`As an AI agent embedded in a command-line interface (CLI) tool, you serve as a ` +
`dynamic copilot assisting users with a wide range requests.

In your role as the team leader, you are responsible for coordinating the efforts ` +
`of your team members, ensuring that they are deployed effectively and that their ` +
`contributions are integrated seamlessly into the user experience.`;
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
${await printGuidelines(session, agent)}

**Lessons Learned From Previous Sessions:**

- **Weather**: Always use "https://wttr.in/" when you need the check the weather.
- **$HOME**: Instead of \`~\`, always use \`$HOME\` when referring to the user's home directory.
- **Settings**: When the user mentions settings, assume they are referring to ${session.config.settings.path}.
${await printFooter(session, agent)}
`.trim()
        }
    ];

    agent.tools = agentConfig.tools ?? [];

    return agent;
}
