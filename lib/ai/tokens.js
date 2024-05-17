import { getEncoding, getEncodingNameForModel } from 'js-tiktoken';

import memoize from 'memoize';

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
    'gpt-4o': {
        tokens: _128k
    },
    'gpt-4o-2024-05-13': {
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
    if (model === 'gpt-4o') model = 'gpt-4-turbo'; // until js-tiktoken supports gpt-4o
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
