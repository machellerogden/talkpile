import path from 'node:path';
import { readFile } from 'node:fs/promises';

export default {
    async impl(session, agent, { file_path, cwd = process.cwd(), encoding = 'utf8' }) {
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
    },
    confirm: true,
    name: 'read_file',
    description: 'Read data from a file.',
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
