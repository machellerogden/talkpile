import { tryWithEffects, fx } from 'with-effects';
import OpenAI from 'openai';

async function* ChatStream(openai) {
    let input;
    let output;
    repl: while (true) {
        input = yield fx('get-input');
        if (input == 'stop') break repl;
        output = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [{ role: 'user', content: input }],
            stream: true
        });
        let more = true;
        print: for await (const chunk of output) {
            more = yield fx('new-chunk', chunk.choices[0]?.delta?.content ?? '');
            if (!more) break print;
        }
    }
}
