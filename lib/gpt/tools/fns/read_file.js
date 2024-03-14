import { readFile } from 'node:fs/promises';

async function read_file({ path, encoding = 'utf8' }) {
    let response;
    try {
        response = await readFile(path, encoding);
    } catch (error) {
        response = 'Error reading file: ' + error.message;
    }
    return response;
}

read_file.description = 'IMMEDIATELY call this function when the user wants to end the chat.';

read_file.parameters = {
    type: 'object',
    properties: {
        path: {
            type: 'string',
            description: 'File system path of file to read.'
        },
        encoding: {
            type: 'string',
            description: 'The encoding of the file. Default is `utf8`.'
        }
    },
    required: ['path']
};

export default read_file;
