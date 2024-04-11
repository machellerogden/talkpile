function tryParseNull(json) {
    try {
        return JSON.parse(json);
    } catch (e) {
        return null;
    }
}

export function send(connection, message, options) {
    const payload = options ?? {};
    if (message) payload.message = message;
    const json = JSON.stringify(payload);
    return connection.write(`${json}\n`);
}

export function sendLog(connection, message) {
    return send(connection, message, { log: true });
}

export function sendQuietLog(connection, message) {
    return send(connection, message, { log: true, quiet: true });
}

export function sendPrompt(connection, message) {
    return send(connection, message, { prompt: true });
}

export function sendContextRequest(connection, message) {
    return send(connection, message, { contextRequest: true });
}

export function sendChunk(connection, message) {
    return send(connection, message, { chunk: true });
}

export function editor(connection, message) {
    return send(connection, message, { editor: true });
}

export async function prompt(connection, message, promptFn = sendPrompt) {
    promptFn(connection, message, true);
    let incoming = '';
    let depth = 0;
    let inQuote = false;
    let received;
    try {
        received = await new Promise((resolve, reject) => {
            const handler = async (buf) => {
                const str = buf.toString();
                const chars = str.split('');
                for (let i = 0; i < chars.length; i++) {
                    incoming += chars[i];
                    if (chars[i - 1] == '\\' && chars[i] == '"') continue;
                    if (chars[i] == '"') {
                        inQuote = !inQuote;
                        continue;
                    }
                    if (inQuote) continue;
                    if (['{', '['].includes(chars[i])) {
                        depth++;
                        continue;
                    }
                    if (['}', ']'].includes(chars[i])) {
                        depth--;
                        continue;
                    }
                    if (depth == 0 && !inQuote) {
                        const data = tryParseNull(incoming) ?? { message: '' };
                        resolve(data?.message);
                    }
                }
            };
            connection.on('data', handler);
            connection.on('error', reject);
        });
    } catch (e) {
        console.error(e.stack);
    }
    connection.removeAllListeners();
    return received;
}
