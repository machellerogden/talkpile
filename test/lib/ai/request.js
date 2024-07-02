import { test } from 'zora';
import { truncateChatCompletion } from '../../../lib/ai/request.js';
import { getModelLimit, getMessageTokens, getAllTokens } from '../../../lib/ai/tokens.js';

test('should return the request unchanged if total tokens are within limit', t => {

    const messages = [
        { role: 'system', content: 'System message' },
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' }
    ];

    const request = {
        model: 'gpt-4',
        messages
    };

    const result = truncateChatCompletion(request, 1, 100);

    t.deepEqual(result.messages, messages, 'Messages should remain unchanged');
});

test('should truncate messages to fit within the token limit', t => {

    const messages = [
        { role: 'system', content: 'System message' },
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
        { role: 'user', content: 'How are you?' },
        { role: 'assistant', content: 'I am good, thank you!' },
        { role: 'user', content: 'Great to hear!' },
        { role: 'assistant', content: 'Anything else you need?' },
        { role: 'user', content: 'TAKE MY MONEY!' },
        { role: 'assistant', content: 'I am doing that now.' }
    ];

    const request = {
        model: 'gpt-4',
        messages
    };

    const actualTokens = getAllTokens(request);
    const limit = actualTokens - 1;
    const preludeLength = 2; // system message + user message + assistant message
    const result = truncateChatCompletion(request, 3, limit);

    const expectedMessages = [
        { role: 'system', content: 'System message' },
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
        { role: 'user', content: 'Great to hear!' },
        { role: 'assistant', content: 'Anything else you need?' },
        { role: 'user', content: 'TAKE MY MONEY!' },
        { role: 'assistant', content: 'I am doing that now.' }
    ];

    const expectedTokens = getMessageTokens(expectedMessages);

    t.deepEqual(result.messages, expectedMessages, 'Messages should be truncated correctly');

});
