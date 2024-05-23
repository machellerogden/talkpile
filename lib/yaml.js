import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import Mustache from 'mustache';
import { findUpSync } from 'find-up';

const IncludeType = new yaml.Type('!include', {
    kind: 'scalar',
    resolve: (data) => typeof data === 'string',
    construct: (data) => {
        const filePath = path.resolve(data);
        const fileContents = fs.readFileSync(filePath, 'utf8');
        return yaml.load(fileContents, { schema: TALKPILE_CONFIG_SCHEMA });
    }
});

const TemplateType = new yaml.Type('!template', {
    kind: 'scalar',
    resolve: (data) => typeof data === 'string',
    construct: (data) => (view) => Mustache.render(data, view)
});

export const TALKPILE_CONFIG_SCHEMA = yaml.DEFAULT_SCHEMA.extend([ IncludeType, TemplateType ]);

export function loadYaml(text) {
    return yaml.load(text, { schema: TALKPILE_CONFIG_SCHEMA });
}

export function loadYamlFileSync(filePath) {
    const text = fs.readFileSync(filePath, 'utf8');
    return loadYaml(text);
}
