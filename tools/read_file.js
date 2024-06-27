import { resolve } from 'node:path';
import { readFile } from 'node:fs/promises';

export const handler = async (session, agent, { path, file_path, cwd = process.cwd(), encoding = 'utf8' }) => {
    let response;
    file_path = file_path ?? path; // LLM mixes up path and file_path constantly.
    try {
        const options = {};
        if (encoding) options.encoding = encoding;

        const resolved = resolve(cwd, file_path);
        response = await readFile(resolved, options);
    } catch (error) {
        response = 'Error reading file: ' + error.message;
    }
    return response;
};
