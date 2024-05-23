import path from 'node:path';
import { readFile } from 'node:fs/promises';

export const handler = async (session, agent, { file_path, cwd = process.cwd(), encoding = 'utf8' }) => {
    let response;
    try {
        const options = {};
        if (encoding) options.encoding = encoding;

        const resolved = path.resolve(cwd, file_path);
        response = await readFile(resolved, options);
    } catch (error) {
        response = 'Error reading file: ' + error.message;
    }
    return response;
};
