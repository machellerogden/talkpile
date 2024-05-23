import { exec } from 'node:child_process';
import process from 'node:process';

export const handler = async (session, agent, args) => {
    const { command, cwd = process.cwd() } = args;
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
};
