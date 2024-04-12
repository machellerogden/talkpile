import { packageFns } from '../index.js';
import { printHeader, printGuidelines, printFooter } from '../templates/index.js';

import fetch_webpage from '../tools/fns/fetch_webpage.js';
import mkdir from '../tools/fns/mkdir.js';
import pwd from '../tools/fns/pwd.js';
import read_dir from '../tools/fns/read_dir.js';
import read_file from '../tools/fns/read_file.js';
import shell_exec from '../tools/fns/shell_exec.js';
import write_file from '../tools/fns/write_file.js';

export async function load(session, kitConfig) {
    const kit = { ...kitConfig };

    kit.command = `talkpile`;
    kit.name = `Talkpile`;
    kit.description = `Talkpile team leader, and the user's primary interface to the Talkpile system.`;
    kit.identity =
`As an AI agent embedded in a command-line interface (CLI) tool, you serve as a ` +
`dynamic copilot assisting users with a wide range requests.

In your role as the team leader, you are responsible for coordinating the efforts ` +
`of your team members, ensuring that they are deployed effectively and that their ` +
`contributions are integrated seamlessly into the user experience.`;
    kit.provider = 'openai';
    kit.model = 'gpt-4-0125-preview';
    kit.temperature = 0.3;
    kit.frequency_penalty = 0.2;
    kit.presence_penalty = 0.2;

    kit.fns = {
        fetch_webpage,
        mkdir,
        pwd,
        read_dir,
        read_file,
        shell_exec,
        write_file
    };

    kit.getPrelude = async (session) => [
        {
            role: 'system',
            content: `
${await printHeader(session, kit)}
${await printGuidelines()}

**Lessons Learned From Previous Sessions:**

- **Weather**: Always use "https://wttr.in/" when you need the check the weather.
- **$HOME**: Instead of \`~\`, always use \`$HOME\` when referring to the user's home directory.
- **Settings**: When the user mentions settings, assume they are referring to ${session.context.settings_path}.
${await printFooter(session, kit)}
`.trim()
        }
    ];

    return kit;
}
