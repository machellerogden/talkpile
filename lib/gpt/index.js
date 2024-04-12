import { EOL } from 'node:os';
import { core } from './tools/index.js';
import { fx } from 'with-effects';
import { printPrefix, printKV, COLOR, inspect } from '../print.js';
import { truncateCompletion } from './utils.js';

export async function* GPT(session, options) {

    options = options ?? {};

    const {
        kit = {},
        message = {},
        exitInterview = false
    } = options;

    const {
        config: { name, debug }
    } = session;

    const messages = [];

    const { fns, getPrelude, getTools } = kit;
    let { model, temperature, frequency_penalty, presence_penalty } = kit;

    model = model ?? 'gpt-4-turbo-preview';
    temperature = temperature ?? 0.3;
    frequency_penalty = frequency_penalty ?? 0.2;
    presence_penalty = presence_penalty ?? 0.2;

    const contextPrefix = [
        session.printPrompt(),
        printPrefix('gpt', COLOR.info),
        session.prefixes.map(p => printPrefix(p, COLOR.mode)).join(' ')
    ].join(' ');

    const user = {};

    if (name) user.name = name;

    let prompt = !message?.content?.length;

    if (!prompt) messages.push(message);

    let lastWord = false;

    repl: while (true) {
        let input;

        if (prompt) {
            yield fx('send-chunk', EOL);
            input = yield fx('get-input', contextPrefix + ' ' + printPrefix(name ?? 'user', COLOR.user) + ' ');

            const userMessage = {
                role: 'user',
                content: input,
                ...user
            };

            messages.push(userMessage);
        } else {
            prompt = true;
        }

        if (['q', 'quit', 'exit', 'stop'].includes(input)) break repl;

        const prelude = await getPrelude(session);
        const tools = await getTools(session);

        const completionRequest = truncateCompletion(
            {
                model,
                temperature,
                frequency_penalty,
                presence_penalty,
                n: 1,
                messages: [
                    ...prelude,
                    ...messages
                ],
                tools,
                stream: true
            },
            prelude.length
        );

        if (debug) console.log('completionRequest', inspect(completionRequest));

        const stream = yield fx('request-chat-completion', completionRequest);

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
                    yield fx('send-chunk', contextPrefix + ' ' + printPrefix(role, COLOR.assistant) + EOL + EOL);
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
                if (debug) console.log('toolCallRequestMessage', inspect(toolCallRequestMessage));
                messages.push(toolCallRequestMessage);

                const fnName = tool_call.function.name;

                let fnArgs = {};

                try {
                    fnArgs = JSON.parse(tool_call.function.arguments);
                } catch (e) {
                    yield fx(
                        'send-error',
                        `can't parse arguments`,
                        tool_call.function.arguments,
                        e.stack
                    );
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

    if (exitInterview) {
        const prelude = await getPrelude(session);
        const tools = await getTools(session);
        const content =
            'Please provide a concise summary explaining the outcome of this conversation. This will be used to debrief the team about your session with the user.';
        const outcomeSummaryRequest = truncateCompletion(
            {
                model,
                temperature,
                frequency_penalty,
                presence_penalty,
                n: 1,
                messages: [
                    ...prelude,
                    ...messages,
                    {
                        role: 'user',
                        content
                    }
                ],
                tools
            },
            prelude.length
        );

        yield fx('send-quiet-log', printPrefix('delegate', COLOR.info) + ' ' + content);

        const outcomeSummaryResponse = yield fx('request-chat-completion', outcomeSummaryRequest);
        const summary =
            outcomeSummaryResponse?.choices?.[0]?.message.content ?? kit.command + ' done';

        yield fx('send-quiet-log', printKV('summary response', summary));

        return summary;
    }

    return kit.command + ' done';

    async function* applyFn(role, fnId, fnName, fnArgs) {
        try {
            let toolResponse;

            const { loc, action, orientation, operations, label, desc, task, assignee } = fnArgs;

            if (fnName === 'goodbye') lastWord = true;

            if (fnName === 'delegate' && assignee in session.delegates) {
                session.prefixes.push(assignee);
                toolResponse = yield* await session.delegates[assignee](task, kit.name, role);
                session.prefixes.pop();
            } else if (fnName in fns) {
                try {
                    toolResponse = yield fx(fnName, session, fnArgs);
                } catch (toolError) {
                    toolResponse =
                        'Error from tool ' +
                        fnName +
                        ' with ' +
                        fnArgs +
                        ' - ERROR - ' +
                        toolError.stack;
                }
            } else {
                console.log('unhandled-tool-call', role, fnId, fnName, fnArgs);
                toolResponse = yield fx('unhandled-tool-call', {
                    role,
                    tool_call: {
                        id: fnId,
                        function: {
                            name: fnName,
                            arguments: fnArgs
                        }
                    }
                });
            }

            if (debug) console.log(printKV('tool_response', inspect(toolResponse)));

            const toolCallResponseMessage = {
                tool_call_id: fnId,
                role: 'tool',
                name: fnName,
                content: String(toolResponse ?? 'OK')
            };

            messages.push(toolCallResponseMessage);

            yield fx('send-log', printPrefix(role, COLOR.assistant) + ' Used ' + fnName + ' tool');
        } catch (e) {
            yield fx(
                'send-error',
                printPrefix(role, COLOR.assistant) +
                    ' Used ' +
                    fnName +
                    ' tool but there was an error:' +
                    e.stack
            );
        }
    }
}

export async function packageDelegates(session) {
    const { config, printPrompt } = session;
    const delegates = {};
    // Below creates the delegation handlers for each kit.
    for (const [ kitName, kitConfig ] of Object.entries(config.kits)) {
        if (kitConfig.disabled) continue;
        try {

            if (config.debug) console.log(`Loading Kit:`, kitName, kitConfig);

            if (kitConfig.import == null) {
                console.error(`Error loading kit: ${kitName}`, 'No import path specified.');
                throw new Error(`Error loading kit: ${kitName}`);
            }

            const kitModule = await import(kitConfig.import);

            const kit = session.kits[kitName] = await kitModule.load(session, kitConfig);

            if (kit.name == null) {
                console.error(`Error loading kit: ${kitName}`, 'No name specified.');
                throw new Error(`Error loading kit: ${kitName}`);
            }

            if (kit.command == null) {
                console.error(`Error loading kit: ${kitName}`, 'No command specified.');
                throw new Error(`Error loading kit: ${kitName}`);
            }

            if (kit.description == null) {
                console.error(`Error loading kit: ${kitName}`, 'No description specified.');
                throw new Error(`Error loading kit: ${kitName}`);
            }

            kit.identity = kit.identity ?? `As an AI agent embedded in a command-line interface (CLI) tool, you serve as a dynamic copilot assisting users with a wide range requests.`;
            kit.provider = kit.provider ?? 'openai';
            kit.model = kit.model ?? 'gpt-4-0125-preview';
            kit.temperature = kit.temperature ?? 0.3;
            kit.frequency_penalty = kit.frequency_penalty ?? 0.2;
            kit.presence_penalty = kit.presence_penalty ?? 0.2;

            kit.fns = Object.assign(kit.fns, core.fns);
            kit.getTools = () => packageFns(session, kit);

            // GPT, I hereby appoint you as my delegate to be called upon when
            // the command is given. Know of this session and take with you the
            // tools in this kit. Go forth and do my bidding.
            delegates[kit.command] = async (task, from, role) => {

                role = role || 'user';
                from = from || 'user';
                task = task || `This is a request from ${from}. Please greet ${config.name}.`;

                const options = {
                    kit,
                    exitInterview: role != 'user'
                };
                options.message = { role: role == 'user' ? 'user' : 'system', content: task };

                if (!config.quiet) {
                    console.log([
                        printPrompt(session),
                        printPrefix('delegate', COLOR.info),
                        `Calling ${kit.command} delegate. `,
                        (task ? `Task: ` + task : '')
                    ].join(' '));
                }

                return GPT(session, options);
            }

        } catch (error) {
            console.error(`Error loading kit: ${kitName}`, error.stack);
            continue;
        }
    }
    return delegates;
}

export async function packageFn(session, kit, fn) {
    let packagedFn;

    packagedFn = typeof fn === 'function'
        ? await packageFn(session, kit, await fn(session, kit))
        : { type: 'function', 'function': fn };

    return packagedFn;
}

export async function packageFns(session, kit) {
    return Object.values(kit.fns).reduce(async (acc, fn) => {
        acc = await acc;
        acc.push(await packageFn(session, kit, fn));
        return acc;
    }, []);
}
