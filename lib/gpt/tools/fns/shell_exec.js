import { exec } from 'node:child_process';
import process from 'node:process';

export default async function shell_exec(session, args) {
    const { command, cwd = process.cwd() } = args;
    return new Promise(async (resolve) => {
        try {
            exec(command, { cwd }, (error, stdout, stderr) => {
                if (error) {
                    console.error('error running shell_exec', stdout);
                    resolve(`Error running shell_exec: ${error.stack}`);
                } else {
                    console.log('Output of shell_exec', stdout);
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
