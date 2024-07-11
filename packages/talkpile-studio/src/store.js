import { writable } from 'svelte/store';

export const activeComponent = writable(null);
export const inputSchema = writable({ type: 'text', placeholder: 'Type here...' });
