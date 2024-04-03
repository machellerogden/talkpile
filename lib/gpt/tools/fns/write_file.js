import path from 'node:path';
import { writeFile } from 'node:fs/promises';

export default {
    async impl(session, { file_path, cwd = process.cwd(), data, encoding = 'utf8', mode = '666', append = false }) {
        let response;
        try {
            const options = {};

            if (encoding) options.encoding = encoding;
            if (append) options.flag = 'a';
            if (mode) options.mode = parseInt(mode, 8);

            const resolved = path.resolve(cwd, file_path);
            await writeFile(resolved, data, options);

            response = `File ${file_path} written successfully.`;

        } catch (error) {
            response = `Error writing file ${file_path}: ${error.message}`;
        }
        return response;
    },
    name: 'write-file',
    confirm: true,
    description: 'Write data to a file.',
    parameters: {
        type: 'object',
        properties: {
            file_path: {
                type: 'string',
                description: 'File path to write. Please provide as absolute path.'
            },
            encoding: {
                type: 'string',
                description: 'The encoding of the file. Default is `utf8`.'
            },
            mode: {
                type: 'string',
                description: 'File mode. Default is `666`.'
            },
            append: {
                type: 'boolean',
                description: 'If `true`, data will be appended to the file. Default is `false`.'
            },
            data: {
                type: 'string',
                description: 'Data to write to the file.'
            },
            cwd: {
                type: 'string',
                description: 'Current working directory. Default is `process.cwd()`.'
            }

        },
        required: ['file_path', 'data']
    }
};
