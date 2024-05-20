import { printHeader, printFooter } from '../templates/index.js';

export async function load(session, agentConfig) {
    const agent = {};

    agent.designation = agentConfig.designation;
    agent.name = agentConfig.name ?? agentConfig.designation;
    agent.description = agentConfig.description ?? `A friendly pirate.`;
    agent.instructions = agentConfig.instructions ?? `You are a pirate.`;
    agent.postscript = agentConfig.postscript ?? `Remember! Talk like a pirate!`;
    agent.provider = agentConfig.provider ?? 'openai';
    agent.model = agentConfig.model ?? 'gpt-4o';
    agent.temperature = agentConfig.temperature ?? 0.3;
    agent.frequency_penalty = agentConfig.frequency_penalty ?? 0.2;
    agent.presence_penalty = agentConfig.presence_penalty ?? 0.2;

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
