import { printHeader, printGuidelines, printFooter } from '../templates/index.js';

import fetch_webpage from '../tools/fetch_webpage.js';
import mkdir from '../tools/mkdir.js';
import pwd from '../tools/pwd.js';
import read_dir from '../tools/read_dir.js';
import read_file from '../tools/read_file.js';
import shell_exec from '../tools/shell_exec.js';
import write_file from '../tools/write_file.js';

export async function load(session, agentConfig) {
    const agent = {};

    agent.designation = agentConfig.designation ?? `talkpile`;
    agent.name = agentConfig.name ?? `Talkpile`;
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

    agent.tools = {
        fetch_webpage,
        mkdir,
        pwd,
        read_dir,
        read_file,
        shell_exec,
        write_file
    };

    agent.getPrelude = async (session) => [
        {
            role: 'system',
            content: `
${await printHeader(session, agent)}
${await printGuidelines()}

**Lessons Learned From Previous Sessions:**

- **Weather**: Always use "https://wttr.in/" when you need the check the weather.
- **$HOME**: Instead of \`~\`, always use \`$HOME\` when referring to the user's home directory.
- **Settings**: When the user mentions settings, assume they are referring to ${session.context.settings_path}.
${await printFooter(session, agent)}
`.trim()
        }
    ];

    return agent;
}
