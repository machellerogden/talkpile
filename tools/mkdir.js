import path from 'node:path';
import { mkdir as _mkdir } from 'node:fs/promises';

export const handler = async (session, agent, { dir_path, cwd = process.cwd(), mode = '777', recursive = true }) => {
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
};
