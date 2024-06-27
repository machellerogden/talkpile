import { getModelLimit, getMessageTokens, getAllTokens } from './tokens.js';

export function truncateCompletion(request, preludeLength = 0) {

    const limit = getModelLimit(request.model);

    // DEBUG
    console.log('model token limit:', limit);

    const total = getAllTokens(request);

    // DEBUG
    console.log('total tokens:', total);

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

    if (request.tools?.length == 0) {
        delete request.tools;
    }

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
