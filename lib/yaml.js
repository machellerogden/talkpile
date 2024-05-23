import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import Mustache from 'mustache';

// no HTML escaping
Mustache.escape = text => text;

export function loadYamlFileSync(filePath) {
    const cwd = path.dirname(filePath);
    const text = fs.readFileSync(filePath, 'utf8');

    const IncludeType = new yaml.Type('!include', {
        kind: 'scalar',
        resolve: (data) => typeof data === 'string',
        construct: (data) => {
            const filePath = path.resolve(cwd, data);
            const fileContents = fs.readFileSync(filePath, 'utf8');
            return yaml.load(fileContents, { schema: TALKPILE_CONFIG_SCHEMA });
        }
    });

    const TemplateType = new yaml.Type('!template', {
        kind: 'scalar',
        resolve: (data) => typeof data === 'string',
        construct: (data) => (view) => Mustache.render(data, view)
    });

    const TALKPILE_CONFIG_SCHEMA = yaml.DEFAULT_SCHEMA.extend([ IncludeType, TemplateType ]);

    return yaml.load(text, { schema: TALKPILE_CONFIG_SCHEMA });
}
