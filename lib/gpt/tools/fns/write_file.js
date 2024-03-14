import { writeFile } from 'node:fs/promises';

export default async function write_file(session, { path, data, encoding = 'utf8', mode = '666', append = false }) {
    let response;
    try {
        const options = {};

        if (encoding) options.encoding = encoding;
        if (append) options.flag = 'a';
        if (mode) options.mode = parseInt(mode, 8);

        await writeFile(path, data, options);

        response = 'File written successfully.';

    } catch (error) {
        response = 'Error writing file: ' + error.message;
    }
    return response;
}

write_file.description = 'Write data to a file.';

write_file.parameters = {
    type: 'object',
    properties: {
        path: {
            type: 'string',
            description: 'File path to write.'
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
        }
    },
    required: ['path', 'data']
};
