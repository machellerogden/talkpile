import { persisted } from 'svelte-persisted-store'
import { readable, writable } from 'svelte/store';

const _darkMode = persisted('dark_mode', false);

export const darkMode = {
    subscribe: _darkMode.subscribe,
    set: _darkMode.set,
    update: _darkMode.update,
    toggle: () => _darkMode.update(v => !v)
};

const activeShortcut = writable(null);

const ignoreNodes = new Set([
    'INPUT', 'TEXTAREA', 'SELECT'
]);

function listenForKeys(mapping) {
    const handlers = [ ...mapping.entries() ].map(([ chars, handler ]) => {
        let typed = '';
        return async function triggerListener(event) {
            const ignore = ignoreNodes.has(event.target.nodeName);
            if (ignore) return;
            typed += event.key;
            if (!chars.startsWith(typed)) {
                typed = '';
            } else if (typed.length === chars.length) {
                typed = '';
                await handler();
            }
        };
    });
    return event => handlers.forEach(h => h(event));
}

const triggerListener = listenForKeys(new Map([
    ['g', () => activeShortcut.set('go')],
    ['f', () => activeShortcut.set('find')],
    ['?', () => activeShortcut.set('help')],
    ['Escape', () => activeShortcut.set(null)],
    ['d', () => darkMode.update(s => !s)]
]));

export const keyboardShortcut = {
    clear() {
        activeShortcut.set(null);
    },
    subscribe(cb) {
        const unsub = activeShortcut.subscribe(cb);
        window.addEventListener('keyup', triggerListener);
        return function unsubscribe() {
            unsub();
            window.removeEventListener('keyup', triggerListener);
        };
    }
};

export const dragging = writable(false);
