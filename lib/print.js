import chalk from 'chalk';
import stripAnsi from 'strip-ansi';
import { inspect as _inspect } from 'node:util';

export const COLOR = {
    info: 'dim',
    error: 'red',
    warn: 'red',
    user: 'cyan',
    assistant: 'magenta',
    mode: 'yellow',
};

export function printPrefix(label, color = COLOR.user) {
    const text = chalk[color]('[') + label + chalk[color](']') + ' ';
    return color ? text : stripAnsi(text);
}

export const inspect = v => _inspect(v, { colors: true, depth: null });
