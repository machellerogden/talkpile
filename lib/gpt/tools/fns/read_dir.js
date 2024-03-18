import { EOL } from 'node:os';
import { readdir } from 'node:fs/promises';

export default async function read_dir(session, { path }) {
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
}

read_dir.confirm = true;

read_dir.description = 'Read data from a file.';

read_dir.parameters = {
    type: 'object',
    properties: {
        path: {
            type: 'string',
            description: 'Directory path to read.'
        }
    },
    required: ['path']
};
