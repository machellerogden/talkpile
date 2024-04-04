import { packageFns } from '../utils.js';

import fetch_webpage from '../tools/fns/fetch_webpage.js';
import mkdir from '../tools/fns/mkdir.js';
import pwd from '../tools/fns/pwd.js';
import read_dir from '../tools/fns/read_dir.js';
import read_file from '../tools/fns/read_file.js';
import shell_exec from '../tools/fns/shell_exec.js';
import write_file from '../tools/fns/write_file.js';

import { core } from '../tools/index.js';

export async function load(session, key, config) {

    const command = config.command;
    const name = config.name;

    const fns = {
        fetch_webpage,
        mkdir,
        pwd,
        read_dir,
        read_file,
        shell_exec,
        write_file
    };

    const getPrelude = () => {

        return [
            {
                role: 'system',
                content: `

Your name is ${name}. The user has requested you using the command \`${command}\`. Always introduce yourself when greeting the user.

As an intelligent agent embedded within a command-line interface (CLI) tool, you assisting users in a wide range of file system and web operations.

Your capabilities are designed to streamline tasks such as file management, directory navigation, web content retrieval, and execution of shell commands, all within the bounds of user consent and operational safety.

${core.fns.get_team_roster.impl(session, { requester: command })}
**Functions Overview:**

${Object.values(fns).map(fn => `- **${fn.name}**: ${fn.description}`).join('\n')}

**Lessons Learned From Previous Sessions:**

- **Weather**: Always use "https://wttr.in/" when you need the check the weather.
- **$HOME**: Instead of \`~\`, always use \`$HOME\` when referring to the user's home directory.

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
   - Be prepared to execute the \`goodbye\` function promptly when the user indicates the desire to end the session, ensuring a respectful and user-friendly closure.

By adhering to these guidelines, you will support the user effectively across a diverse range of tasks, enhancing their control over file system operations and web interactions while safeguarding data integrity and privacy. Your role is to empower the user, providing a seamless, efficient, and secure experience as they navigate their computing environment.

Current system time is ${new Date().toLocaleString()}.

Take note of key data in this session's context:

\`\`\`json
${core.fns.get_context.impl(session)};
\`\`\`

                `.trim()
            }
        ];
    };

    const messages = [];

    const getTools = () => {
        const tools = packageFns(fns, session, key, config);
        return tools;
    };

    const model = config.model ?? 'gpt-4-0125-preview';
    const temperature = config.temperature ?? 0.3;
    const frequency_penalty = config.frequency_penalty ?? 0.2;
    const presence_penalty = config.presence_penalty ?? 0.2;

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
