import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import yaml from 'js-yaml';
import Mustache from 'mustache';

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

const TALKPILE_CONFIG_SCHEMA = yaml.DEFAULT_SCHEMA.extend([ IncludeType, TemplateType ]);

function loadYaml(text) {
    return yaml.load(text, { schema: TALKPILE_CONFIG_SCHEMA });
}

function loadYamlFile(filePath) {
    const text = fs.readFileSync(filePath, 'utf8');
    return loadYaml(text);
}

const config = loadYamlFile('./sandbox/talkpile.yml');
//const config = loadYaml(`
//context: {}
//agents: !include sandbox/roster.yml
//templates:
  //intro: !template |
    //Your official designation is {{agent.designation}}. The user and your teammates may also refer to you casually as **{{agent.name}}**.

    //{{agent.instructions}}

    //You are a contributing member of team of specialists. The rest of your team is standing by, ready and willing to assist you.

    //**Your Team:**

    //{{#team}}
      //- **{{designation}}**: Also known as {{name}}. {{description}}
    //{{/team}}

    //Collaborate with other agents on the team using the one-shot \`message_team_member\` tool. Alternatively, hand-off control of the user's session to another agent with the \`delegate\` tool.

    //**Tools Overview:**

    //{{#tools}}
      //- **{{function.name}}**: {{function.description}}
    //{{/tools}}
//`.trim());

console.log(config);

console.log(config.templates.intro({
    agent: {
        designation: 'agent_47',
        name: 'Diana',
        instructions: 'Do your job.'
    },
    team: [
        {
            designation: 'agent_1',
            name: 'Alice',
            description: 'The best.'
        }
    ],
    tools: [
        {
            function: {
                name: 'tool_1',
                description: 'The best tool.'
            }
        }
    ]
}));

