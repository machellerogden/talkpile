import Joi from 'joi';

export const DEFAULT_PROVIDER = 'openai';
export const DEFAULT_MODEL = 'gpt-4o';
export const DEFAULT_TEMPERATURE = 0.3;
export const DEFAULT_FREQUENCY_PENALTY = 0.2;
export const DEFAULT_PRESENCE_PENALTY = 0.2;
export const DEFAULT_INSTRUCTIONS = `As an AI agent embedded in a command-line interface (CLI) tool, you serve as a dynamic copilot assisting users with a wide range requests.`;
export const DEFAULT_DESCRIPTION = 'General-purpose AI agent';
export const DEFAULT_PRELUDE = [];

export const agentSchema = Joi.object({
    designation: Joi.string().required(),
    name: Joi.string().optional().default(Joi.ref('designation')),
    description: Joi.string().optional().allow('').default(DEFAULT_DESCRIPTION),
    instructions: Joi.string().optional().allow('').default(DEFAULT_INSTRUCTIONS),
    sendoff: Joi.string().optional().allow(''),
    provider: Joi.string().optional().default(DEFAULT_PROVIDER),
    model: Joi.string().optional().default(DEFAULT_MODEL),
    temperature: Joi.number().optional().default(DEFAULT_TEMPERATURE),
    frequency_penalty: Joi.number().optional().default(DEFAULT_FREQUENCY_PENALTY),
    presence_penalty: Joi.number().optional().default(DEFAULT_PRESENCE_PENALTY),
    prelude: Joi.array().items(Joi.object()).optional().default([]),
    tools: Joi.array().items(Joi.string()).optional().default([]),
    getPrelude: Joi.function().optional(),
    getTools: Joi.function().optional()
});
