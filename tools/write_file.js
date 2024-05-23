import path from 'node:path';
import { writeFile } from 'node:fs/promises';

export const handler = async (session, agent, { file_path, cwd = process.cwd(), data, encoding = 'utf8', mode = '666', append = false }) => {
    let response;
    try {
        const options = {};

        if (encoding) options.encoding = encoding;
        if (append) options.flag = 'a';
        if (mode) options.mode = parseInt(mode, 8);

        const resolved = path.resolve(cwd, file_path);
        await writeFile(resolved, data, options);

        response = `File ${file_path} written successfully.`;

    } catch (error) {
        response = `Error writing file ${file_path}: ${error.message}`;
    }
    return response;
};
