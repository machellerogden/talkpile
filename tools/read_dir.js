import { EOL } from 'node:os';
import { readdir } from 'node:fs/promises';

export const handler = async (session, agent, { path }) => {
    let response;
    try {
        const options = { withFileTypes: true };
        response = '';
        const files = await readdir(path, options);
        for (const file of files) {
            if (file.isDirectory()) {
                response += file.name + '/' + EOL;
            } else if (file.isFile()) {
                response += file.name + EOL;
            }
        }
    } catch (error) {
        response = 'Error reading file: ' + error.message;
    }
    return response;
};
