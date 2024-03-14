import { EOL } from 'node:os';
import { fx } from 'with-effects';
import chalk from 'chalk';
import { printPrefix, COLOR } from '../print.js';
import { hasTool } from './tools/util.js';
import { tools as coreTools, fns as coreFns } from './tools/core.js';

export async function* GPT({ openai, name, messages, tools, prelude, debug } = {}) {

    const gptPrefix = printPrefix('gpt', COLOR.mode);

    const user = {};
    if (name) user.name = name;

    messages = messages ?? [];
    tools = tools ?? [];
    prelude = prelude ?? [];

    for (const tool of coreTools) {
        if (hasTool(tools, tool.name)) continue;
        tools.push(tool);
    }

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

            if (fnName === 'goodbye') lastWord = true;

            if (fnName in coreFns) {
                if (typeof coreFns[fnName] === 'function') {
                    toolResponse = coreFns[fnName](fnArgs);
                } else {
                    toolResponse = coreFns[fnName];
                }
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
