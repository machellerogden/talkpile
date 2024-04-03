import { fx } from 'with-effects';
import { parseInput } from './parse.js';

async function* handleInput(session, input) {

    const { command, args } = parseInput(input);

    let result = true;

    // shed scope
    if (['stop', 'close', 'leave'].includes(command)) {
        result = false;

    // quit session
    } else if (['disconnect', 'q', 'quit', 'exit'].includes(command)) {
        yield fx('disconnect');

    } else if (command === 'editor') {
        input = yield fx('get-editor-input');

    } else if (command == 'help') {
        yield fx('help');

    } else if (command in session.delegates) {
        session.prefixes.push(command);
        result = yield* await session.delegates[command](args.join(' '), session.config.name, 'user');
        session.prefixes.pop();

    } else if (command === 'fx') {
        yield fx(...args);

    } else {
        yield fx('send-error', 'Unknown command:', command);
    }

    return result;
}

export async function* REPL(session) {

    let input;

    let result;

    while (true) {
        input = yield fx('get-input');
        if (!input?.length) continue;
        result = yield* handleInput(session, input);
        if (!result) break;
    }

    return result;
}
