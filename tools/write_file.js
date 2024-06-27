import { resolve } from 'node:path';
import { writeFile } from 'node:fs/promises';

export const handler = async (session, agent, { path, file_path, cwd = process.cwd(), data, encoding = 'utf8', mode = '666', append = false }) => {
    file_path = file_path ?? path; // LLM mixes up path and file_path constantly.
    let response;
    try {
        const options = {};

        if (encoding) options.encoding = encoding;
        if (append) options.flag = 'a';
        if (mode) options.mode = parseInt(mode, 8);

        const resolved = resolve(cwd, file_path);
        await writeFile(resolved, data, options);

        response = `File ${file_path} written successfully.`;

    } catch (error) {
        response = `Error writing file ${file_path}: ${error.message}`;
    }
    return response;
};
