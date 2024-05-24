import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import Mustache from 'mustache';

Mustache.escape = text => text; // oo oo ee ee ah ah

function ConfigSchema(filePath) {

    const cwd = path.dirname(filePath);

    const IncludeType = new yaml.Type('!include', {
        kind: 'scalar',
        resolve: (data) => typeof data === 'string',
        construct: (data) => {
            const includePath = path.resolve(cwd, data);
            const includeText = fs.readFileSync(includePath, 'utf8');
            return yaml.load(includeText, { schema: ConfigSchema(includePath) });
        }
    });

    const TemplateType = new yaml.Type('!template', {
        kind: 'scalar',
        resolve: (data) => typeof data === 'string',
        construct: (data) => (view) => Mustache.render(data, view)
    });

    const CONFIG_SCHEMA = yaml.DEFAULT_SCHEMA.extend([
        IncludeType,
        TemplateType
    ]);

    return CONFIG_SCHEMA;
}

export function loadYamlFileSync(filePath) {

    const text = fs.readFileSync(filePath, 'utf8');

    return yaml.load(text, { schema: ConfigSchema(filePath) });
}
