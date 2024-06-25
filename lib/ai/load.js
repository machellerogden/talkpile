import { printHeader, printFooter } from './templates.js';

export async function loadAgent(session, agentConfig) {
    const agent = {};

    agent.role = agentConfig.role;
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
${await printFooter(session, agent)}
`.trim()
        }
    ];

    agent.tools = agentConfig.tools ?? [];

    return agent;
}
