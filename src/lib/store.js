import { persisted } from 'svelte-persisted-store';
import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';
import { MODE } from './constants.js';

export const darkMode = persisted('dark_mode', false);
export const mode = writable(MODE.normal);
export const command = writable(null);

function listenForKeys(mapping) {
    const handlers = [...mapping.entries()].map(([chars, handler]) => {
        let typed = '';
        return async function triggerListener(event) {
            typed += event.key;
            if (!chars.startsWith(typed)) {
                typed = '';
            } else if (typed.length === chars.length) {
                typed = '';
                await handler();
            }
        };
    });
    return (event) => handlers.forEach((h) => h(event));
}

export const keyListener = listenForKeys(
    new Map([
        ['Escape', () => mode.set(MODE.normal)],
        [':', () => mode.set(MODE.command)],
        ['i', () => mode.set(MODE.insert)],
        ['v', () => mode.set(MODE.visual)],
        ['?', () => command.set('help')],
        ['d', () => darkMode.update((s) => !s)]
    ])
);
