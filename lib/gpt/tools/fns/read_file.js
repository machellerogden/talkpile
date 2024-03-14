import { readFile } from 'node:fs/promises';

async function read_file(session, { path, encoding = 'utf8' }) {
    let response;
    try {
        const options = {};
        if (encoding) options.encoding = encoding;
        response = await readFile(path, options);
    } catch (error) {
        response = 'Error reading file: ' + error.message;
    }
    return response;
}

read_file.description = 'Read data from a file.';

read_file.parameters = {
    type: 'object',
    properties: {
        path: {
            type: 'string',
            description: 'File path to read.'
        },
        encoding: {
            type: 'string',
            description: 'The encoding of the file. Default is `utf8`.'
        }
    },
    required: ['path']
};

export default read_file;
