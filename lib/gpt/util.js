export const SystemMessage = (content) => ({ role: 'system', content });
export const AssistantMessage = (content) => ({ role: 'assistant', content });
export const UserMessage = (content, name = 'user') => ({ role: 'user', content, name });

export const hasTool = (tools, fnName) =>
    (tools ?? []).find(({ function: { name } = {} }) => name === fnName);

export const packageFns = (fns) =>
    Object.values(fns).map((fn) => ({
        type: 'function',
        function: {
            name: fn.name,
            description: fn.description,
            parameters: fn.parameters
        }
    }));
