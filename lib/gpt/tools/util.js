export const hasTool = (tools, fnName) => (tools ?? []).find(({ function: { name } = {} }) => name === fnName);

export const packageFns = (fns) =>
    Object.values(fns).map(fn => ({
        type: 'function',
        'function': {
            name: fn.name,
            description: fn.description,
            parameters: fn.parameters
        }
    }));

