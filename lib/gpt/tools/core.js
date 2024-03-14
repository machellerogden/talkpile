import { hasTool, packageFns } from './util.js';

import goodbye from './fns/goodbye.js';
import read_dir from './fns/read_dir.js';
import read_file from './fns/read_file.js';
import write_file from './fns/write_file.js';

export const fns = {
    goodbye,
    read_dir,
    read_file,
    write_file
};

export const tools = packageFns(fns);
