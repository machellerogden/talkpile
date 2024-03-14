import path from 'node:path';
import { mkdir as _mkdir } from 'node:fs/promises';

export default async function mkdir(session, args) {
    const { dir_path, cwd = process.cwd() } = args;
    const resolved = path.resolve(cwd, dir_path);
    console.log('Will attempt to mkdir for:', resolved);
    try {
        await _mkdir(resolved, { recursive: true });
        return `Directory "${dir_path}" successfully created.`;
    } catch (error) {
        return `Error creating ${dir_path}`;
    }
}

mkdir.description = 'Create a directory.';

mkdir.parameters = {
    type: 'object',
    properties: {
        dir_path: {
            type: 'string',
            description: 'Directory path to create.'
        },
        cwd: {
            type: 'string',
            description: 'Current working directory. Default is `process.cwd()`.'
        }
    },
    required: ['dir_path']
};
