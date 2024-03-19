import { editAsync } from 'external-editor';

export async function edit(text) {
    return new Promise((resolve, reject) => {
        try {
            editAsync(text, (error, value) => {
                if (error) return reject(error);
                resolve(value);
            });
        } catch (error) {
            reject(error);
        }
    });
}

export function extractPassThroughArgs(argv) {
    return argv.reduce((a, v) => {
        if (Array.isArray(a)) a.push(v);
        if (v === '--') a = [];
        return a;
    }, null) ?? [];
}
