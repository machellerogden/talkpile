import add_team_member from './add_team_member.js';
import delegate from './delegate.js';
import fetch_webpage from './fetch_webpage.js';
import get_context from './get_context.js';
import get_team_roster from './get_team_roster.js';
import goodbye from './goodbye.js';
import message_team_member from './message_team_member.js';
import mkdir from './mkdir.js';
import open from './open.js';
import pwd from './pwd.js';
import read_dir from './read_dir.js';
import read_file from './read_file.js';
import remove_team_member from './remove_team_member.js';
import set_context from './set_context.js';
import shell_exec from './shell_exec.js';
import update_team_member from './update_team_member.js';
import write_file from './write_file.js';

export const core = {
    delegate,
    message_team_member,
    get_context,
    get_team_roster,
    goodbye,
    set_context
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

export const dev = {
    ...fs,
    ...web,
    shell_exec,
    open
};

export const hr = {
    add_team_member,
    remove_team_member,
    update_team_member
};

export const builtin = {
    ...dev,
    ...hr
};
