import path from 'node:path';
import { readFile } from 'node:fs/promises';

export default async function read_file(session, { file_path, cwd = process.cwd(), encoding = 'utf8' }) {
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
}

read_file.confirm = true;

read_file.description = 'Read data from a file.';

read_file.parameters = {
    type: 'object',
    properties: {
        file_path: {
            type: 'string',
            description: 'File path to read.'
        },
        encoding: {
            type: 'string',
            description: 'The encoding of the file. Default is `utf8`.'
        },
        cwd: {
            type: 'string',
            description: 'Current working directory. Default is `process.cwd()`.'
        }
    },
    required: ['file_path']
};
