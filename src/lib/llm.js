import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: '<key here>',
    dangerouslyAllowBrowser: true
});

export const buildChatCompletionConfig = (options) => {
    if (!options?.messages?.length) throw new Error('cannot send empty messages');

    const config = {};

    config.messages = options.messages;
    config.model = options?.model ?? 'gpt-4-0613';
    if (options?.function_call) config.function_call = options.function_call;
    if (options?.functions?.length)
        config.functions = options.functions.map(({ name, description, parameters }) => ({
            name,
            description,
            parameters
        }));
    config.max_tokens = options?.max_tokens ?? 500;
    config.temperature = options?.temperature ?? 1;
    config.n = options?.n ?? 1;
    config.top_p = options?.top_p ?? 1;
    config.frequency_penalty = options?.frequency_penalty ?? 0;
    config.presence_penalty = options?.presence_penalty ?? 0;

    return config;
};

export const getChatCompletion = async (options) => {
    const config = buildChatCompletionConfig(options);
    const completion = await openai.chat.completions.create(config);
    // {
    //   id: 'chatcmpl-7ZUVIe4vEIWqEgDFFTw9WiD2joC7O',
    //   object: 'chat.completion',
    //   created: 1688693092,
    //   model: 'gpt-3.5-turbo-0613',
    //   choices: [
    //     {
    //       index: 0,
    //       message: {
    //         role: 'assistant',
    //         content: null,
    //         function_call: {
    //           name: 'get_current_weather',
    //           arguments: '{\n"location": "Chicago, IL"\n}'
    //         }
    //       },
    //       finish_reason: 'function_call'
    //     }
    //   ],
    //   usage: { prompt_tokens: 96, completion_tokens: 17, total_tokens: 113 }
    // }
    console.log(`********************`);
    console.log(completion?.choices?.[0]?.message?.content);
    console.log(`********************`);
    return completion;
};

export const SystemMessage = (content) => ({
    content,
    role: 'system'
});

export const AIMessage = (content) => ({
    content,
    role: 'assistant'
});

export const UserMessage = (content, name = 'User') => ({
    content,
    role: 'user',
    name
});
