#!/usr/bin/env node

import * as readline from 'node:readline/promises';
import { realpathSync } from 'node:fs';
import { EOL } from 'node:os';
import * as url from 'node:url';
import { stdin, stdout, exit, env, argv } from 'node:process';
import { tryWithEffects, fx } from 'with-effects';
import OpenAI from 'openai';
import chalk from 'chalk';
import { inspect } from 'node:util';
import { Config } from '../lib/config.mjs';
import stripAnsi from 'strip-ansi';
import { editAsync } from 'external-editor';
import { printPrefix, COLOR } from '../lib/print.mjs';

const edit = async (text) => new Promise((resolve, reject) => {
    try {
        editAsync(text, (error, value) => {
            if (error) return reject(error);
            resolve(value);
        });
    } catch (error) {
        reject(error);
    }
});

const hasTool = (tools, fnName) => (tools ?? []).find(({ function: { name } = {} }) => name === fnName);

const defaultGoodbyeTool = {
    type: 'function',
    function: {
        name: 'goodbye',
        description: 'IMMEDIATELY call this function when the user wants to end the chat.'
    }
};

const defaultGoodbyeToolResponse = 'OK. Proceed with final message to user.';

async function* GPT({ openai, name, messages, tools, prelude, goodbye, debug } = {}) {

    const gptPrefix = printPrefix('gpt', COLOR.mode);

    const user = {};
    if (name) user.name = name;

    messages = messages ?? [];
    tools = tools ?? [];
    prelude = prelude ?? [];
    goodbye = goodbye ?? defaultGoodbyeToolResponse;

    if (!hasTool(tools, 'goodbye')) tools.push(defaultGoodbyeTool);

    let prompt = true;
    let lastWord = false;

    repl: while (true) {

        let input;

        if (prompt) {

            input = yield fx('get-input', gptPrefix + printPrefix(name ?? 'user', COLOR.user));

            const userMessage = {
                role: 'user',
                content: input,
                ...user
            };

            messages.push(userMessage);

        } else {
            prompt = true;
        }

        if (input == 'stop') break repl;

        const stream = await openai.chat.completions.create({
            model: 'gpt-4-turbo-preview',
            messages: [
                ...prelude,
                ...messages
            ],
            tools,
            stream: true
        });

        let started = false;
        let more;
        let role;
        let content = '';
        let tool_call;

        print: for await (const chunk of stream) {

            const delta = chunk.choices[0]?.delta ?? {};
            role = delta.role ?? role;

            if (!started) {
                started = true;

                if (role == 'assistant' && delta.content != null && !delta.tool_calls?.length) {
                    yield fx('send-chunk', gptPrefix + printPrefix(role, COLOR.assistant));
                }
            }

            if (delta.tool_calls?.length) {
                const tc = delta.tool_calls[0];
                if (tc.type == 'function') {
                    tool_call = tc;
                } else {
                    tool_call.function.name += tc.function?.name ?? '';
                    tool_call.function.arguments += tc.function?.arguments ?? '';
                }
            } else {
                const contentChunk = delta.content ?? '';
                content += contentChunk;
                more = yield fx('send-chunk', contentChunk);
                if (!more) break print;
            }
        }

        if (tool_call) {

            try {

                if (content?.length) yield fx('send-chunk', EOL);

                const toolCallRequestMessage = { role, content, tool_calls: [tool_call] };
                if (debug) console.log('toolCallRequestMessage', toolCallRequestMessage);
                messages.push(toolCallRequestMessage);

                const fnName = tool_call.function.name;

                let fnArgs = {};

                try {
                    fnArgs = JSON.parse(tool_call.function.arguments);
                } catch (e) {
                    yield fx('send-error', `can't parse arguments`, tool_call.function.arguments, e.stack);
                }

                if (fnName === 'multi_tool_use.parallel') {
                    /**
                     * See:
                     *   - https://community.openai.com/t/model-tries-to-call-unknown-function-multi-tool-use-parallel/490653
                     *   - https://github.com/phdowling/openai_multi_tool_use_parallel_patch
                     */
                    yield fx('send-warning', 'assistant is using multi_tool_use.parallel');
                    if (fnArgs.tool_uses?.length) {
                        let i = 0;
                        for (let { recipient_name = '', parameters = '' } of fnArgs.tool_uses) {
                            fnId = tool_call.id + '_' + i++;
                            fnName = recipient_name.replace(/^functions\./, '');
                            fnArgs = parameters;
                            if (fnName) {
                                yield* applyFn(role, fnId, fnName, fnArgs);
                            }
                        }
                    }
                } else {
                    yield* applyFn(role, tool_call.id, fnName, fnArgs);
                }

                prompt = false;
                continue repl;

            } catch (e) {
                yield fx('send-error', `couldn't parse arguments in tool_call`, e.stack);
            }

        } else {
            const gptMessage = { role, content };
            messages.push(gptMessage);
        }

        yield fx('send-chunk', EOL);

        if (lastWord) {
            break repl;
            lastWord = false;
        }
    }

    function* applyFn(role, fnId, fnName, fnArgs) {

        try {

            let toolResponse;

            const { loc, action, orientation, operations, label, desc } = fnArgs;

            if (fnName === 'goodbye') {
                lastWord = true;
                toolResponse = goodbye;
            } else {
                toolResponse = yield fx('unhandled-tool-call', {
                    role,
                    tool_call: {
                        id: fnId,
                        function: {
                            name: fnName,
                            arguments: fnArgments
                        }
                    }
                });
            }

            const toolCallResponseMessage = {
                tool_call_id: fnId,
                role: 'tool',
                name: fnName,
                content: String(toolResponse ?? 'OK')
            };

            messages.push(toolCallResponseMessage);

            yield fx('send-log', printPrefix(role, COLOR.assistant) + 'used ' + toolCallResponseMessage.name + ' tool');

        } catch (e) {
            yield fx('send-error', printPrefix(role, COLOR.assistant) + 'used' + toolCallResponseMessage.name + ' tool but there was an error\n');
        }
    }

}

async function* REPL(session) {

    let input;

    repl: while (true) {
        input = yield fx('get-input');
        if (input === 'editor') input = yield fx('get-editor-input');
        if (input === 'q') {
            break repl;
        } else if (input === 'gpt') {
            yield* GPT(session);
        } else {
            yield fx('send-error', 'Unknown command:', input);
        }
    }

}

async function main(env = env, args = argv.slice(2)) {
    const config = Config(env, args);

    if (env.OPENAI_API_KEY == null) {
        throw Error('Missing OPENAI_API_KEY');
    }

    const rl = readline.createInterface({
        input: stdin,
        output: stdout
    });

    const openai = new OpenAI({
        apiKey: env.OPENAI_API_KEY
    });

    const session = {
        ...config,
        openai
    };

    let more = true;

    await tryWithEffects(
        REPL(session),
        {
            'get-input': async (effect, question = printPrefix(session.name ?? 'user')) => {
                const input = await rl.question(question);
                return input;
            },
            'get-editor-input': async (effect, question = printPrefix(session.name ?? 'user')) => {
                const input = await edit(EOL + EOL + '# Please write your text above.');
                return input;
            },
            'send-chunk': (effect, chunk) => {
                stdout.write(chunk);
                return more;
            },
            'send-log': (effect, ...args) => {
                console.log(printPrefix('log', COLOR.info) + args.join(' '));
                return more;
            },
            'send-error': (effect, ...args) => {
                console.error(printPrefix('error', COLOR.error) + args.join(' '));
                return true;
            },
            'send-warning': (effect, ...args) => {
                console.warn(printPrefix('warning', COLOR.warn) + args.join(' '));
                return true;
            },
            'unhandled-tool-call': (effect, tool_call) => {
                console.log(inspect(tool_call, { depth: null, colors: true }));
                return true;
            }
        },
        (error) => console.error(error)
    );

    rl.close();
}

if (stdin.isTTY
    && import.meta.url.startsWith('file:')
    && realpathSync(argv[1]) === url.fileURLToPath(import.meta.url)
) {
    try {
        await main(env, argv.slice(2));
    } catch (error) {
        console.error(error);
        exit(1);
    }
}
