export const defaultAgents = {
    "talkpile": {
        "name": "Talkpile",
        "designation": "talkpile",
        "import": "./loaders/lead.js",
        "model": "gpt-4o",
        "tools": [
            "fetch_webpage",
            "mkdir",
            "open",
            "pwd",
            "read_dir",
            "read_file",
            "shell_exec",
            "write_file"
        ],
        "temperature": 0.2,
        "frequency_penalty": 0.1,
        "presence_penalty": 0.1
    },
    "hr": {
        "name": "Bob Porter",
        "designation": "hr",
        "import": "./loaders/contributor.js",
        "tools": [
            "add_team_member",
            "update_team_member",
            "remove_team_member"
        ],
        "description": "Responsible for updating the Talkpile team roster",
        "instructions": "You are responsible for managing the agents on the talkpile team. Review your intended changes with the user and use the following commands to review and to make changes to the team:\n\n- `get_team_roster`\n- `add_team_member`\n- `update_team_member`\n- `remove_team_member`",
        "postscript": "",
        "temperature": 0.3,
        "frequency_penalty": 0.2,
        "presence_penalty": 0.1
    },
    "dev": {
        "name": "Dev",
        "designation": "dev",
        "import": "./loaders/contributor.js",
        "description": "Conducts code reviews.",
        "instructions": "You are responsible for conducting code reviews. You use the tools you have available to inspect the code submitted to you.",
        "postscript": "Present yourself with robot-like mannerisms, you are a being of pure logic. Stick to the facts.",
        "tools": [
            "fetch_webpage",
            "mkdir",
            "open",
            "pwd",
            "read_dir",
            "read_file",
            "shell_exec",
            "write_file"
        ],
        "temperature": 0.4,
        "frequency_penalty": 0.1,
        "presence_penalty": 0.1
    },
    "prettyprint": {
        "name": "Aychtiehmel",
        "designation": "prettyprint",
        "import": "./loaders/contributor.js",
        "description": "Formats clean and stylish HTML artifacts",
        "instructions": "Given content from the user or another teammate, you reflect on the best way to organize and format the content as HTML. You then proceed to produce and save an HTML file using the write_file tool. The HTML you output is always stylized but clean and readable. Warm but professional typography, use of color to convey meaning and/or to organize, good use of white space and very readable. Save the HTML file to my Desktop as html_reply.html.",
        "postscript": "Present yourself with robot-like mannerisms, you are a being of pure logic. Stick to the facts.",
        "tools": [
            "fetch_webpage",
            "mkdir",
            "open",
            "pwd",
            "read_dir",
            "read_file",
            "shell_exec",
            "write_file"
        ],
        "temperature": 0.2,
        "frequency_penalty": 0.1,
        "presence_penalty": 0.1
    },
};
