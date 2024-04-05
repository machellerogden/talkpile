import { getEncoding, getEncodingNameForModel } from 'js-tiktoken';

import memoize from 'memoize';

export const hasTool = (tools, fnName) =>
    (tools ?? []).find(({ function: { name } = {} }) => name === fnName);

const _4k = 4096;
const _8k = 8192;
const _16k = 16384;
const _32k = 32768;
const _128k = 131072;

const models = {
    'gpt-4': {
        tokens: _8k
    },
    'gpt-4-0613': {
        tokens: _8k
    },
    'gpt-4-32k': {
        tokens: _32k
    },
    'gpt-4-32k-0613': {
        tokens: _32k
    },
    'gpt-4-0125-preview': {
        tokens: _128k
    },
    'gpt-4-turbo-preview': {
        tokens: _128k
    },
    'gpt-3.5-turbo': {
        tokens: _4k
    },
    'gpt-3.5-turbo-16k': {
        tokens: _16k
    },
    'gpt-3.5-turbo-0613': {
        tokens: _4k
    },
    'gpt-3.5-turbo-16k-0613': {
        tokens: _16k
    },
    'gpt-3.5-turbo-0125': {
        tokens: _16k
    },
    'gpt-3.5-turbo-instruct': {
        tokens: _4k
    }
};

export const defaultModel = 'gpt-3.5-turbo-16k';

function _getModel(model = '') {
    const lookup = models[model];
    if (!lookup) {
        console.warn(`The model "${model}" is not configured. Defaulting to "${defaultModel}"`)
        return models[defaultModel]
    }
    return lookup
}

export const getModel = memoize(_getModel);

function _getEncoder(model = '') {
    try {
        return getEncoding(getEncodingNameForModel(model));
    } catch (err) {
        return getEncodingNameForModel('cl100k_base');
    }
}

export const getEncoder = memoize(_getEncoder);

export const encode = (text, model) => getEncoder(model).encode(text);

export const decode = (array, model) => getEncoder(model).decode(array);

export const getMessageTokens = (message, model) => {
    let count = 0;
    if (message.content) {
        count += encode(message.content, model).length;
    }
    if (message.tool_call) {
        count += encode(JSON.stringify(message.tool_call), model).length;
    }
    return count;
}

export const getModelLimit = (model = '') => getModel(model).tokens;

export const getAllTokens = (request = {}) => {
    let count = 0;
    if (request.tools?.length) {
        count += encode(JSON.stringify(request.tools), request.model).length;
    }
    count += request.messages.reduce((total, message) => total + getMessageTokens(message, request.model), 0);
    return count;
}

export function truncateCompletion(request, preludeLength = 0) {

    const limit = getModelLimit(request.model);
    const total = getAllTokens(request);

    if (total <= limit) return request;

    const prelude = request.messages.slice(0, preludeLength);
    const body = request.messages.slice(preludeLength);

    const { partitioned } = body.reduce((acc, message) => {
        const { last, partitioned } = acc;
        if (message.role === 'user' && (last.role === 'assistant' && last.tool_call == null)) {
            partitioned.push([]);
        }
        partitioned.at(-1).push(message);
        return { last: message, partitioned };
    }, {
        last: prelude.at(-1) ?? { role: 'system' },
        partitioned: [[]]
    });

    const head = [];

    let used = 0;

    for (const message of prelude) {
        used += getMessageTokens(message, request.model);
        if (used > limit) break;
        head.push(message);
    }

    const tail = [];
    for (const partition of partitioned.reverse()) {
        const ptotal = getAllTokens({ model: request.model, messages: partition });
        if (used + ptotal > limit) break;
        for (const message of partition.reverse()) {
            tail.unshift(message);
        }
    }

    request.messages = head.concat(tail);

    return request;
}

// const exampleRequest = {
//     model: 'gpt-3.5-turbo',
//     messages: [
//         {
//             role: 'system',
//             content: '00000 '.repeat(10)
//         },
//         {
//             role: 'user',
//             content: 'aaaaa '.repeat(10)
//         },
//         {
//             role: 'assistant',
//             content: 'bbbbb '.repeat(10)
//         },
//         {
//             role: 'user',
//             content: 'ccccc '.repeat(10)
//         },
//         {
//             role: 'assistant',
//             content: 'ddddd '.repeat(10),
//             tool_call: {
//                 id: '123',
//                 function: {
//                     name: 'fetch_webpage',
//                     arguments: {
//                         url: 'https://example.com'
//                     }
//                 }
//             }
//         },
//         {
//             role: 'tool',
//             tool_call_id: '123',
//             name: 'fetch_webpage',
//             content: 'eeeee '.repeat(100)
//         },
//         {
//             role: 'user',
//             content: 'fffff '.repeat(100)
//         },
//         {
//             role: 'assistant',
//             content: 'ggggg '.repeat(100)
//         },
//         {
//             role: 'user',
//             content: 'hhhhh '.repeat(10)
//         }
//     ]
// };
//console.log(getAllTokens(exampleRequest));
//console.log(truncateCompletion(exampleRequest, 2));
//console.log(truncateCompletion(exampleRequest, 1));

