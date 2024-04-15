import delegate from './fns/delegate.js';
import goodbye from './fns/goodbye.js';
import get_context from './fns/get_context.js';
import set_context from './fns/set_context.js';
import get_team_roster from './fns/get_team_roster.js';
import pwd from './fns/pwd.js';
import mkdir from './fns/mkdir.js';
import read_dir from './fns/read_dir.js';
import read_file from './fns/read_file.js';
import write_file from './fns/write_file.js';
import fetch_webpage from './fns/fetch_webpage.js';

export const core = {
    fns: {
        delegate,
        goodbye,
        get_context,
        set_context,
        get_team_roster
    }
};

export const fs = {
    pwd,
    mkdir,
    read_dir,
    read_file,
    write_file
};

export const web = {
    fetch_webpage
};

export const builtin = {
    ...fs,
    ...web
};
