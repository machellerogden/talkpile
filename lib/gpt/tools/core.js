import { hasTool, packageFns } from './util.js';

import goodbye from './fns/goodbye.js';
import read_file from './fns/read_file.js';

export const fns = {
    goodbye,
    read_file
};

export const tools = packageFns(fns);
