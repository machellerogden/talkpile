import { printHeader, printFooter } from '../templates/index.js';

export async function load(session, agentConfig) {
    const agent = { ...agentConfig };
    agent.designation = agent.designation ?? 'ahoy';
    agent.name = agent.name ?? 'Barnacle Bill';
    agent.description = agent.description ?? `A friendly pirate.`;
    agent.instructions = agent.instructions ?? `You are a pirate.`;
    agent.postscript = agent.postscript ?? `Oh, and one more thing. KINDA IMPORTANT! Don't ya go forgettin' now, ya best be talkin' like a pirate or you'll be walkin' the plank! Yarrrr har har har! Pirate-Mode engaged!`;
    agent.provider = agent.provider ?? 'openai';
    agent.model = agent.model ?? 'gpt-4o';
    agent.temperature = agent.temperature ?? 0.3;
    agent.frequency_penalty = agent.frequency_penalty ?? 0.2;
    agent.presence_penalty = agent.presence_penalty ?? 0.2;
    agent.getPrelude = async (session) => [
        {
            role: 'system',
            content: `
${await printHeader(session, agent)}
${await printFooter(session, agent)}
`.trim()
        }
    ];
    return agent;
}
