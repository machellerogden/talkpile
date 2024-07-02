import { createVertex } from '@ai-sdk/google-vertex';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { createOllama } from 'ollama-ai-provider';

import {
    experimental_createProviderRegistry,
    generateText, generateObject, streamText, streamObject
 } from 'ai';

export const createProviderRegistry = (providerConfigs) => {
    const providers = {};

    if (providerConfigs.openai) providers.openai = createOpenAI(providerConfigs.openai);
    if (providerConfigs.anthropic) providers.anthropic = createAnthropic(providerConfigs.anthropic);
    if (providerConfigs.vertex) providers.vertex = createVertex(providerConfigs.vertex);
    if (providerConfigs.ollama) providers.ollama = createOllama(providerConfigs.ollama);

    return experimental_createProviderRegistry(providers);
};

export async function generatePrompt(registry, { model, system, prompt }) {
    model = registry.languageModel(model);
    system = system ?? null;
    prompt = prompt ?? [];
    const result = await generateText({
        model,
        system,
        prompt
    });
    return result;
}

export async function streamFromPrompt(registry, { model, system, prompt }) {
    model = registry.languageModel(model);
    system = system ?? null;
    prompt = prompt ?? [];
    const result = await streamText({
        model,
        system,
        prompt
    });
    return result;
}

export async function generateObjectFromPrompt(registry, { model, schema, system, prompt }) {
    model = registry.languageModel(model);
    schema = schema ?? null;
    prompt = prompt ?? [];
    const result = await generateObject({
        model,
        schema,
        system,
        prompt
    });
    return result;
}

export async function streamObjectFromPrompt(registry, { model, schema, system, prompt }) {
    model = registry.languageModel(model);
    schema = schema ?? null;
    prompt = prompt ?? [];
    const result = await streamObject({
        model,
        schema,
        system,
        prompt
    });
    return result;
}


export async function generateFromMessages(registry, { model, messages }) {
    model = registry.languageModel(model);
    messages = messages ?? [];
    const result = await generateText({
        model,
        messages
    });
    return result;
}

export async function streamFromMessages(registry, { model, messages }) {
    model = registry.languageModel(model);
    messages = messages ?? [];
    const result = await streamText({
        model,
        messages
    });
    return result;
}

export async function generateObjectFromMessages(registry, { model, schema, messages }) {
    model = registry.languageModel(model);
    schema = schema ?? null;
    messages = messages ?? [];
    const result = await generateObject({
        model,
        schema,
        messages
    });
    return result;
}

export async function streamObjectFromMessages(registry, { model, schema, messages }) {
    model = registry.languageModel(model);
    schema = schema ?? null;
    messages = messages ?? [];
    const result = await streamObject({
        model,
        schema,
        messages
    });
    return result;
}

//const providerConfigs = {
    //openai: {
        //apiKey: process.env.OPENAI_API_KEY
    //},
    //anthropic: {
        //apiKey: process.env.ANTHROPIC_API_KEY
    //},
    //vertex: {
        //project: 'gateless-sandbox',
        //location: 'us-central1'
    //},
    //ollama: {
        //baseUrl: 'http://localhost:11434/api'
    //}
//};

//const registry = createProviderRegistry(providerConfigs);

//const { fullStream } = await streamFromMessages(registry, {
    ////model: 'openai:gpt-4o',
    ////model: 'vertex:gemini-1.5-pro',
    ////model: 'anthropic:claude-3-5-sonnet-20240620',
    ////model: 'ollama:llama3',
    //messages: [
        //{ role: 'system', content: 'You are a helpful assistant.' },
        //{ role: 'user', content: 'Hello!' },
        //{ role: 'assistant', content: 'Hi there!' }
    //]
//});

//console.log();
//for await (const chunk of fullStream) process.stdout.write(chunk);
//console.log();

//import { z } from 'zod';

//const { partialObjectStream } = await streamObjectFromPrompt(registry, {
    ////model: 'openai:gpt-4o',
    //model: 'vertex:gemini-1.5-pro', // doesn't work, have examples of manually coercing JSON this with a tool though
    //// model: 'anthropic:claude-3-5-sonnet-20240620',
    //schema: z.object({
        //recipe: z.object({
            //name: z.string(),
            //ingredients: z.array(z.object({ name: z.string(), amount: z.string() })),
            //steps: z.array(z.string()),
        //}),
    //}),
    //prompt: 'Generate a lasagna recipe.'
//});

//process.stdout.write('\r\n');
//for await (const chunk of partialObjectStream) process.stdout.write(JSON.stringify(chunk, null, 2));
//process.stdout.write('\r\n');
