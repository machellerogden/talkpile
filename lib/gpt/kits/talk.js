import { packageFns } from '../utils.js';
import { printIntro, printGuidelines, printContext, printTeamRoster, printFunctions } from '../templates/index.js';

import fetch_webpage from '../tools/fns/fetch_webpage.js';
import mkdir from '../tools/fns/mkdir.js';
import pwd from '../tools/fns/pwd.js';
import read_dir from '../tools/fns/read_dir.js';
import read_file from '../tools/fns/read_file.js';
import shell_exec from '../tools/fns/shell_exec.js';
import write_file from '../tools/fns/write_file.js';

import { core } from '../tools/index.js';

export async function load(session, kitConfig) {

    const command = kitConfig.command = kitConfig.command ?? `talk`;
    const name = kitConfig.name = kitConfig.name ?? `Talkpile`;
    const identity = kitConfig.identity = kitConfig.identity ?? `As an AI agent embedded in a command-line interface (CLI) tool, you serve as a dynamic copilot assisting users in a wide range of file system and web operations. Your capabilities are designed to streamline tasks such as file management, directory navigation, web content retrieval, and execution of shell commands, all within the bounds of user consent and operational safety.`;

    const fns = {
        fetch_webpage,
        mkdir,
        pwd,
        read_dir,
        read_file,
        shell_exec,
        write_file
    };

    const getPrelude = async () => {
        return [
            {
                role: 'system',
                content: `
${await printIntro(kitConfig)}
${await printTeamRoster({ session, command })}
${await printFunctions({ fns, session, kitConfig })}
${await printGuidelines()}

**Lessons Learned From Previous Sessions:**

- **Weather**: Always use "https://wttr.in/" when you need the check the weather.
- **$HOME**: Instead of \`~\`, always use \`$HOME\` when referring to the user's home directory.
${printContext({ context: session.context })}
`.trim()
            }
        ];
    };

    const messages = [];

    const getTools = () => packageFns(fns, session, kitConfig);

    const model = kitConfig.model ?? 'gpt-4-0125-preview';
    const temperature = kitConfig.temperature ?? 0.3;
    const frequency_penalty = kitConfig.frequency_penalty ?? 0.2;
    const presence_penalty = kitConfig.presence_penalty ?? 0.2;

    const description = `AI agent for a command-line interface (CLI) tool`;

    return {
        name,
        description,
        command,
        getPrelude,
        messages,
        fns,
        getTools,
        model,
        temperature,
        frequency_penalty,
        presence_penalty
    };
}
