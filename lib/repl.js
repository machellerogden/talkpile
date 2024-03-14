import { fx } from 'with-effects';
import { GPT } from '../lib/gpt/index.js';
import * as coreKit from '../lib/gpt/kits/core.js';

export async function* REPL(session) {
    let input;
    repl: while (true) {
        input = yield fx('get-input');
        if (input === 'editor') input = yield fx('get-editor-input');
        if (['q','quit','exit'].includes(input)) {
            break repl;
        } else if (input === 'gpt') {
            yield* GPT(session, coreKit);
        } else {
            yield fx('send-error', 'Unknown command:', input);
        }
    }
}
