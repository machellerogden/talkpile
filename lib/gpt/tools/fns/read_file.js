import path from 'node:path';
import { readFile } from 'node:fs/promises';
import enquirer from 'enquirer';

export default async function read_file(session, { file_path, cwd = process.cwd(), encoding = 'utf8' }) {
    let response;
    const confirm = await enquirer.prompt({
        type: 'confirm',
        name: 'confirm',
        message: `Read file: ${file_path} (cwd: ${cwd}, encoding: ${encoding})?`
    });
    if (!confirm) return 'File not read. Reason: User declined.';
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
