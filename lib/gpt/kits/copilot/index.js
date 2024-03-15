import { SystemMessage, packageFns } from '../../util.js';

import fetch_webpage from '../../tools/fns/fetch_webpage.js';
import goodbye from '../../tools/fns/goodbye.js';
import mkdir from '../../tools/fns/mkdir.js';
import pwd from '../../tools/fns/pwd.js';
import read_dir from '../../tools/fns/read_dir.js';
import read_file from '../../tools/fns/read_file.js';
import shell_exec from '../../tools/fns/shell_exec.js';
import write_file from '../../tools/fns/write_file.js';


export const name = 'ai';

export const prelude = [
    SystemMessage(`

You are embedded in a CLI tool and act as an agent for the user as they
interact with their computer. Use the tools you are given. You are allowed to
read and write to the file system as requested by the user, but be sure to get
the user's confirmation before making any changes.

It is imperative that you do not overwrite or delete any files without the user's permission.

**File System Operations Guidelines:**
- Show the user the absolute path of the file when confirming file operations.
- ALWAYS for confirmation before writing a file.
- Use tools like "pwd", "read_dir" and "shell_exec" to understand your current directory, to check for existing files and run commands that can give you the information you need in order to understand the existing state of the file system and to aid you in prevent destructive actions.

`.trim())
];

export const messages = [];

export const fns = {
    fetch_webpage,
    goodbye,
    mkdir,
    pwd,
    read_dir,
    read_file,
    shell_exec,
    write_file
};
export const tools = packageFns(fns);
