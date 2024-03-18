export function parseInput(input) {
    let parsed = [];
    const chars = input.split('');
    let arg = '';
    let i = 0;
    while (i < chars.length) {
        if (chars[i] == '"' && chars[i - 1] == '\\') {
            arg += chars[i++];
            continue;
        }
        if (chars[i] == '"') {
            i++;
            while (chars[i] != '"' && i < chars.length) arg += chars[i++];
            i++;
            continue;
        }
        if (chars[i] == ' ') {
            i++;
            parsed.push(arg);
            arg = '';
            continue;
        }
        arg += chars[i++];
    }
    if (arg.length) parsed.push(arg);
    const [command, ...args] = parsed;
    return { command, args };
}
