import { EOL } from 'node:os';
import { core as coreTools, builtin as builtinTools } from './tools/index.js';
import { fx } from 'with-effects';
import { printPrefix, printKV, COLOR, inspect } from '../print.js';
import { truncateCompletion } from './utils.js';

export async function* GPT(session, options) {

    options = options ?? {};

    const {
        agent = {},
        message = {},
    } = options;

    let {
        exitInterview = false
    } = options

    const {
        config: { name, debug }
    } = session;

    const messages = [];

    const { tools, getPrelude, getTools } = agent;
    let { model, temperature, frequency_penalty, presence_penalty } = agent;

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
            input = yield fx('send-chunk', EOL + contextPrefix + ' ' + printPrefix(name ?? 'user', COLOR.user) + EOL);
            input = yield fx('get-input');

            const userMessage = {
                role: 'user',
                content: input,
                ...user
            };

            messages.push(userMessage);
        } else {
            prompt = true;
        }

        if (['q', 'quit', 'exit', 'stop'].includes(input)) {
            exitInterview = false;
            break repl;
        }

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
                    yield fx('send-chunk', EOL + contextPrefix + ' ' + printPrefix(role, COLOR.assistant) + EOL + EOL);
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

                const toolName = tool_call.function.name;

                let toolArgs = {};

                try {
                    toolArgs = JSON.parse(tool_call.function.arguments);
                } catch (e) {
                    yield fx(
                        'send-error',
                        `can't parse arguments`,
                        tool_call.function.arguments,
                        e.stack
                    );
                }

                if (toolName === 'multi_tool_use.parallel') {
                    /**
                     * See:
                     *   - https://community.openai.com/t/model-tries-to-call-unknown-function-multi-tool-use-parallel/490653
                     *   - https://github.com/phdowling/openai_multi_tool_use_parallel_patch
                     */
                    yield fx('send-warning', 'assistant is using multi_tool_use.parallel');
                    if (toolArgs.tool_uses?.length) {
                        let i = 0;
                        for (let { recipient_name = '', parameters = '' } of toolArgs.tool_uses) {
                            toolId = tool_call.id + '_' + i++;
                            toolName = recipient_name.replace(/^functions\./, '');
                            toolArgs = parameters;
                            if (toolName) {
                                yield* applyTool(role, toolId, toolName, toolArgs);
                            }
                        }
                    }
                } else {
                    yield* applyTool(role, tool_call.id, toolName, toolArgs);
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
            outcomeSummaryResponse?.choices?.[0]?.message.content ?? agent.designation + ' done';

        yield fx('send-quiet-log', printKV('summary response', summary));

        return summary;
    }

    return agent.designation + ' done';

    async function* applyTool(role, toolId, toolName, toolArgs) {
        try {
            let toolResponse;

            const { loc, action, orientation, operations, label, desc, task, assignee } = toolArgs;

            if (toolName === 'goodbye') lastWord = true;

            if (toolName === 'delegate' && assignee in session.delegates) {
                session.prefixes.push(assignee);
                toolResponse = yield* await session.delegates[assignee](task, agent.name, role);
                session.prefixes.pop();
            } if (toolName === 'delegate') {
                console.log('********************************************************************************');
                console.log('delegate', assignee, 'not found in session.delegates');
                console.log('********************************************************************************');
            } else if (toolName in tools) {
                try {
                    toolResponse = yield fx(toolName, toolArgs);
                } catch (toolError) {
                    toolResponse =
                        'Error from tool ' +
                        toolName +
                        ' with ' +
                        toolArgs +
                        ' - ERROR - ' +
                        toolError.stack;
                }
            } else {
                console.log('unhandled-tool-call', role, toolId, toolName, toolArgs);
                toolResponse = yield fx('unhandled-tool-call', {
                    role,
                    tool_call: {
                        id: toolId,
                        function: {
                            name: toolName,
                            arguments: toolArgs
                        }
                    }
                });
            }

            if (debug) console.log(printKV('tool_response', inspect(toolResponse)));

            const toolCallResponseMessage = {
                tool_call_id: toolId,
                role: 'tool',
                name: toolName,
                content: String(toolResponse ?? 'OK')
            };

            messages.push(toolCallResponseMessage);

            yield fx('send-log', printPrefix(role, COLOR.assistant) + ' Used ' + toolName + ' tool');
        } catch (e) {
            yield fx(
                'send-error',
                printPrefix(role, COLOR.assistant) +
                    ' Used ' +
                    toolName +
                    ' tool but there was an error:' +
                    e.stack
            );
        }
    }
}

export async function packageAgents(session) {

    const { config, printPrompt } = session;
    const agents = {};

    for (const [ agentKey, agentConfig ] of Object.entries(config.agents)) {

        if (agentConfig.disabled) continue;

        try {

            if (config.debug) console.log(`Loading Agent:`, agentKey, agentConfig);

            agentConfig.import = agentConfig.import ?? `./agents/contributor.js`;

            const agentModule = await import(agentConfig.import);
            const agent = await agentModule.load(session, agentConfig);

            if (agent.name == null) {
                console.error(`Error loading agent: ${agentKey}`, 'No name specified.');
                throw new Error(`Error loading agent: ${agentKey}`);
            }

            if (agent.designation == null) {
                console.error(`Error loading agent: ${agentKey}`, 'No designation specified.');
                throw new Error(`Error loading agent: ${agentKey}`);
            }

            if (agent.description == null) {
                console.error(`Error loading agent: ${agentKey}`, 'No description specified.');
                throw new Error(`Error loading agent: ${agentKey}`);
            }

            agent.instructions = agent.instructions ?? `As an AI agent embedded in a command-line interface (CLI) tool, you serve as a dynamic copilot assisting users with a wide range requests.`;
            agent.provider = agent.provider ?? 'openai';
            agent.model = agent.model ?? 'gpt-4o';
            agent.temperature = agent.temperature ?? 0.3;
            agent.frequency_penalty = agent.frequency_penalty ?? 0.2;
            agent.presence_penalty = agent.presence_penalty ?? 0.2;
            agent.tools = agent.tools ?? {};

            for (const toolName of (agentConfig.tools ?? [])) {
                agent.tools[toolName] = builtinTools[toolName] ?? (() => `No function found for tool: ${toolName}`);
            }

            agent.tools = Object.assign(agent.tools, coreTools);
            agent.getTools = () => packageTools(session, agent);

            agents[agent.designation] = agent;

        } catch (error) {
            console.error(`Error loading agent: ${agentKey}`, error.stack);
            continue;
        }
    }
    return agents;
}

export async function packageDelegates(session) {
    const { config, printPrompt } = session;
    const delegates = {};
    // Below creates the delegation handlers for each agent.
    for (const agent of Object.values(session.agents)) {
        if (agent.disabled) continue;
        try {
            // GPT, I hereby appoint you as my delegate to be called upon when
            // your designation is uttered. Know of this session and take with
            // you the tools in this agent. Go forth and do my bidding.
            delegates[agent.designation] = async (task, from, role) => {

                role = role || 'user';
                from = from || 'user';
                task = task || `This is a request from ${from}. Please greet ${config.name}.`;

                const options = {
                    agent,
                    exitInterview: role != 'user'
                };
                options.message = { role: role == 'user' ? 'user' : 'system', content: task };

                if (!config.quiet) {
                    console.log([
                        printPrompt(session),
                        printPrefix('delegate', COLOR.info),
                        `Calling ${agent.designation} delegate. `,
                        (task ? `Task: ` + task : '')
                    ].join(' '));
                }

                return GPT(session, options);
            }
        } catch (error) {
            console.error(`Error loading agent: ${agent.designation}`, error.stack);
            continue;
        }
    }
    return delegates;
}

export async function packageTool(session, agent, tool) {
    let packagedTool;

    packagedTool = typeof tool === 'function'
        ? await packageTool(session, agent, await tool(session, agent))
        : { type: 'function', 'function': tool };

    return packagedTool;
}

export async function packageTools(session, agent) {
    return Object.values(agent.tools).reduce(async (acc, tool) => {
        acc = await acc;
        acc.push(await packageTool(session, agent, tool));
        return acc;
    }, []);
}
