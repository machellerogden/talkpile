import path from 'node:path';
import { mkdir as _mkdir } from 'node:fs/promises';

export default async function mkdir(session, { dir_path, cwd = process.cwd(), mode = '777', recursive = true }) {
    let response;
    try {
        const { dir_path, cwd = process.cwd() } = args;
        const resolved = path.resolve(cwd, dir_path);
        if (mode) options.mode = parseInt(mode, 8);
        await _mkdir(resolved, { mode, recursive });
        response = `Directory "${dir_path}" successfully created.`;
    } catch (error) {
        response = `Error creating ${dir_path}: ${error.message}`;
    }
    return response;
}

mkdir.confirm = true;

mkdir.description = 'Create a directory.';

mkdir.parameters = {
    type: 'object',
    properties: {
        dir_path: {
            type: 'string',
            description: 'Directory path to create.'
        },
        recursive: {
            type: 'boolean',
            description: 'If `true`, parent directories will be created if they do not exist.',
            default: true
        },
        mode: {
            type: 'string',
            description: 'File mode. Default is `777`.'
        },
        cwd: {
            type: 'string',
            description: 'Current working directory. Default is `process.cwd()`.'
        }
    },
    required: ['dir_path']
};
