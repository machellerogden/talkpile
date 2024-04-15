import { printHeader, printFooter } from '../templates/index.js';
import { core } from '../tools/index.js';

export async function load(session, kitConfig) {
    const kit = { ...kitConfig };

    kit.command = kit.command ?? 'ahoy';
    kit.name = kit.name ?? 'Barnacle Bill';
    kit.description = kit.description ?? `A friendly pirate.`;
    kit.identity = kit.identity ?? `You are a pirate.`;
    kit.postscript = kit.postscript ?? `Oh, and one more thing. KINDA IMPORTANT! Don't ya go forgettin' now, ya best be talkin' like a pirate or you'll be walkin' the plank! Yarrrr har har har! Pirate-Mode engaged!`;
    kit.provider = kit.provider ?? 'openai';
    kit.model = kit.model ?? 'gpt-4-0125-preview';
    kit.temperature = kit.temperature ?? 0.3;
    kit.frequency_penalty = kit.frequency_penalty ?? 0.2;
    kit.presence_penalty = kit.presence_penalty ?? 0.2;

    kit.fns = {};

    kit.getPrelude = async (session) => [
        {
            role: 'system',
            content: `
${await printHeader(session, kit)}
${await printFooter(session, kit)}
`.trim()
        }
    ];

    return kit;
}
