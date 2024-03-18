import { exec } from 'node:child_process';
import process from 'node:process';
import enquirer from 'enquirer';

export default async function shell_exec(session, args) {
    const { command, cwd = process.cwd() } = args;
    const confirm = await enquirer.prompt({
        type: 'confirm',
        name: 'confirm',
        message: `Run command: ${command} (cwd: ${cwd})?`
    });
    if (!confirm) return 'Command not run. Reason: User declined.';
    return new Promise(async (resolve) => {
        try {
            exec(command, { cwd }, (error, stdout, stderr) => {
                if (error) {
                    resolve(`Error running shell_exec: ${error.stack}`);
                } else {
                    resolve(stdout);
                }
            });
        } catch (error) {
            return resolve(`Error running shell_exec: ${error.stack}`);
        }
    });
}

shell_exec.description = 'Run a shell command.';

shell_exec.parameters = {
    type: 'object',
    properties: {
        command: {
            type: 'string',
            description: 'Command to run.'
        },
        cwd: {
            type: 'string',
            description: 'Current working directory. Default is `process.cwd()`.'
        }
    },
    required: ['command']
};
