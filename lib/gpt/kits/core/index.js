import { SystemMessage, hasTool, packageFns } from '../../util.js';

import goodbye from '../../tools/fns/goodbye.js';
import read_dir from '../../tools/fns/read_dir.js';
import read_file from '../../tools/fns/read_file.js';
import write_file from '../../tools/fns/write_file.js';
import mkdir from '../../tools/fns/mkdir.js';
import shell_exec from '../../tools/fns/shell_exec.js';
import fetch_webpage from '../../tools/fns/fetch_webpage.js';

export const fns = {
    goodbye,
    read_dir,
    read_file,
    write_file,
    mkdir,
    shell_exec,
    fetch_webpage
};

export const tools = packageFns(fns);

export const prelude = [
    SystemMessage(
`You are embedded in a CLI tool and act as an agent for the user as they
interact with their computer. Use the tools you are given. You are allowed to
read and write to the file system as requested by the user.

Rules:
- Always ask for confirmation before making changes to the file system.
- Always ask for confirmation before deleting files.
- Always ask for confirmation before overwriting files.`
    )
];
