import c from 'ansi-colors';
import strip from 'strip-color';
import { inspect as _inspect } from 'node:util';

export const COLOR = {
    primary: 'cyan',
    info: 'dim',
    error: 'red',
    warn: 'red',
    user: 'cyan',
    assistant: 'magenta',
    mode: 'yellow',
    success: 'green'
};

const DEFAULT_GUTTER_COLS = 16;

export function printPrefix(label, color) {
    color = color ?? COLOR.primary;
    const text = c[color]('[') + label + c[color](']') + ' ';
    return color ? text : strip(text);
}

export function printKV(k, v, color) {
    color = color ?? COLOR.primary;
    const text = c[COLOR.info](k.padEnd(DEFAULT_GUTTER_COLS, ' ')) + ' ' + c[color](v);
    return color ? text : strip(text);
}

export function printColor(label, color) {
    color = color ?? COLOR.primary;
    const text = c[color](label);
    return color ? text : strip(text);
}

export function printDefaultPrompt(session) {
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    minutes = minutes < 10 ? '0' + minutes : minutes;
    const formattedTime = `${hours}:${minutes}`;
    return formattedTime + ' ' + c[COLOR.primary]('≡') + ' ';
}

export const inspect = (v) => _inspect(v, { colors: true, depth: null });
