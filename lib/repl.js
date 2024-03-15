import { fx } from 'with-effects';
import { GPT } from '../lib/gpt/index.js';
import { core } from '../lib/gpt/kits/index.js';

function parseInput(input) {
    let parsed = [];
    const chars = input.split('');
    let arg = '';
    let i = 0;
    while (i < chars.length) {
        if (chars[i] == '"' && chars[i - 1] == '\\') {
            arg += chars[i++];
            continue;
        }
        if (chars[i] == '"') {
            i++;
            while (chars[i] != '"' && i < chars.length) arg += chars[i++];
            i++;
            continue;
        }
        if (chars[i] == ' ') {
            i++;
            parsed.push(arg);
            arg = '';
            continue;
        }
        arg += chars[i++];
    }
    if (arg.length) parsed.push(arg);
    const [command, ...args] = parsed;
    return { command, args };
}

async function* handleInput(session, input) {
    const { command, args } = parseInput(input);
    if (['q', 'quit', 'exit', 'stop'].includes(command)) {
        return false;
    }
    if (command === 'gpt') {
        yield* GPT(session, core);
    } else if (command === 'fx') {
        yield fx(...args);
    } else {
        yield fx('send-error', 'Unknown command:', command);
    }
    return true;
}

export async function* REPL(session) {
    let input;
    while (true) {
        input = yield fx('get-input');
        if (input === 'editor') input = yield fx('get-editor-input');
        if (!input?.length) continue;
        const more = yield* handleInput(session, input);
        if (!more) break;
    }
}
