import { EOL } from 'node:os';
import { readdir } from 'node:fs/promises';
import enquirer from 'enquirer';

export default async function read_dir(session, { path }) {
    let response;
    // TODO: abstract confirmation and get it out of here
    const confirm = await enquirer.prompt({
        type: 'confirm',
        name: 'confirm',
        message: `Read directory: ${path}?`
    });
    if (!confirm) return 'Directory not read. Reason: User declined.';
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
