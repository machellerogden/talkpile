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
