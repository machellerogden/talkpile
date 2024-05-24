import { EOL } from 'node:os';
import { fx } from 'with-effects';
import { printPrefix, printKV, COLOR, inspect } from '../print.js';
import { truncateCompletion } from './request.js';
import { agentSchema } from '../schema.js';
import { loadAgent } from './load.js';
import { __package_root } from '../config.js';
import path from 'node:path';

export async function* Agent(session, options) {

    const { config } = session;
    const { user } = config;

    options = options ?? {};

    const {
        agent = {},
        message = {},
        oneShot = false
    } = options;

    const messages = [];

    let { model, temperature, frequency_penalty, presence_penalty } = agent;

    model = model ?? 'gpt-4-turbo-preview';
    temperature = temperature ?? 0.3;
    frequency_penalty = frequency_penalty ?? 0.2;
    presence_penalty = presence_penalty ?? 0.2;

    const promptContextPrefix = [
        session.printPrompt(),
        printPrefix('gpt', COLOR.info),
        session.prefixes.map(p => printPrefix(p, COLOR.mode)).join(' ')
    ].join(' ');

    let prompt = !message?.content?.length;

    if (!prompt) messages.push(message);

    let lastWord = oneShot;
    let exitInterview = !oneShot;

    repl: while (true) {
        let input;

        if (prompt) {
            input = yield fx('send-chunk', EOL + promptContextPrefix + ' ' + printPrefix(user.name ?? 'user', COLOR.user) + EOL);
            input = yield fx('get-input');

            const userMessage = {
                role: 'user',
                content: input
            };

            // TODO: needs to be parametrized per reqest, not static
            if (user.name) userMessage.name = user.name;

            messages.push(userMessage);
        } else {
            prompt = true;
        }

        if (['q', 'quit', 'exit', 'stop'].includes(input)) {
            exitInterview = true;
            break repl;
        }

        const prelude = await agent.getPrelude(session, agent);
        const tools = await packageTools(session, agent);

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
                    yield fx('send-chunk', EOL + promptContextPrefix + ' ' + printPrefix(role, COLOR.assistant) + EOL + EOL);
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
                if (config.debug) console.log('toolCallRequestMessage', inspect(toolCallRequestMessage));
                messages.push(toolCallRequestMessage);

                let toolName = tool_call.function.name;

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
                            let toolId = tool_call.id + '_' + i++;
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

    if (oneShot) {
        return messages.at(-1).content;
    }

    if (exitInterview) {
        const prelude = await agent.getPrelude(session, agent);
        const tools = await packageTools(session, agent);
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

        return `Interaction completed. Here is a summary from team member ${agent.designation}: \n\n${summary}`;
    }

    return agent.designation + ' done';

    async function* applyTool(role, toolId, toolName, toolArgs) {

        const tools = await getTools(session, agent);

        try {
            let toolResponse;

            const { loc, action, orientation, operations, label, desc, message, team_member } = toolArgs;

            if (toolName === 'goodbye') lastWord = true;

            if (toolName === 'message_team_member') {
                if (team_member in session.delegates) {
                    session.prefixes.push(team_member);
                    toolResponse = yield* await session.delegates[team_member](message, agent.designation, 'user', true);
                    session.prefixes.pop();
                } else {
                    throw new Error(`${team_member} not found in session.delegates`);
                }
            } else if (toolName === 'delegate') {
                if (team_member in session.delegates) {
                    session.prefixes.push(team_member);
                    toolResponse = yield* await session.delegates[team_member](message, agent.designation, 'user');
                    session.prefixes.pop();
                } else {
                    throw new Error(`${team_member} not found in session.delegates`);
                }
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

            if (config.debug) console.log(printKV('tool_response', inspect(toolResponse)));

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

export async function getTools(session, agent) {

    const configuredTools = session.config.tools;

    const requiredTools = Object.entries(session.config.tools)
        .reduce((acc, [name, tool]) => {
            if (tool.required) acc.push(name);
            return acc;
        }, []);

    const tools = [
        ...requiredTools,
        ...(agent.tools ?? [])
    ];

    let agentTools = {};

    for (const toolName of tools) {
        if (!(toolName in configuredTools)) {
            throw new Error(`No tool found: ${toolName}. Referenced by agent ${agent.designation}.`);
        }
        const toolConfig = configuredTools[toolName];

        if (toolConfig.handler.type === 'function') {
            try {
                console.log('loading tool', toolConfig.handler.source);
                const modulePath = path.resolve(__package_root, toolConfig.handler.source);
                const module = await import(modulePath);
                if (!module?.handler) {
                    throw new Error(`No handler found in tool: ${toolName}. Referenced by agent ${agent.designation}.`);
                }
                toolConfig.handler.impl = module?.handler;
            } catch (e) {
                console.error(`Error loading tool: ${toolName}. Referenced by agent ${agent.designation}.`, e.stack);
                throw new Error(`Error loading tool: ${toolName}. Referenced by agent ${agent.designation}.`);
            }
        }

        agentTools[toolName] = toolConfig;
    }

    return agentTools;
}

export async function packageAgents(session) {
    const { config } = session;

    // TODO: reload config...

    const agents = {};

    for (const [ agentKey, agentConfig ] of Object.entries(config.agents)) {

        if (agentConfig.disabled) continue;

        try {

            if (config.debug) console.log(`Loading Agent Config:`, agentKey, agentConfig);

            let agent = await loadAgent(session, agentConfig);

            if (config.debug) console.log(`Loaded Agent:`, agent);

            agent = await agentSchema.validateAsync(agent);

            if (config.debug) console.log(`Validated Agent:`, agent);

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

    // TODO: reload config...

    const delegates = {};

    for (const agent of Object.values(session.agents)) {
        if (agent.disabled) continue;
        try {
            // Agent, I hereby appoint you as my delegate to be called upon when
            // your designation is uttered. Know of this session and take with
            // you the tools in this agent. Go forth and do my bidding.
            delegates[agent.designation] = async (input, from, role, oneShot = false) => {

                role = role || 'user';
                from = from || 'user';
                input = input || `Hello.`;

                const options = {
                    agent,
                    oneShot
                };

                options.message = {
                    role: role == 'user' ? 'user' : 'system',
                    content: input
                };

                if (role == 'user') options.message.name = from;

                if (!config.quiet) {
                    console.log([
                        printPrompt(session),
                        printPrefix('delegate', COLOR.info),
                        `Calling ${agent.designation}. `,
                        (oneShot ? `One-shot mode.` : ''),
                        (input ? `Input: ` + input : '')
                    ].join(' '));
                }

                return Agent(session, options);
            }
        } catch (error) {
            console.error(`Error loading agent: ${agent.designation}`, error.stack);
            continue;
        }
    }
    return delegates;
}

export async function packageTool(session, agent, tool) {
    // TODO: revisit dynamic loading of tool definitions
    return tool.definition;
}

export async function packageTools(session, agent) {
    const tools = await getTools(session, agent);
    return Object.values(tools).reduce(async (acc, tool) => {
        acc = await acc;
        acc.push(await packageTool(session, agent, tool));
        return acc;
    }, []);
}
