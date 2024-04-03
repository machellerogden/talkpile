import { EOL } from 'node:os';
import process from 'node:process';

export const exitController = new AbortController();
export const exitSignal = exitController.signal;

function exit(ms = 0) {
    exitController.timeout(ms);
}

export function shutdown(exitCode, signal) {
    console.log(`${EOL}[${signal}] Handling shutdown.${EOL}`);
    exitCode = exitCode ?? 0;
    if (typeof exitCode !== 'number') exitCode = 1;
    process.exit(exitCode);
}

const exitSignals = ['SIGINT', 'SIGTERM', 'SIGQUIT', 'SIGHUP'];

export function registerShutdown(handler = shutdown) {
    exitSignal.addEventListener('abort', () => handler(0), { once: true });

    for (const signal of exitSignals) process.on(signal, () => handler(0, signal));

    process.on('uncaughtException', (e) => {
        console.error(e.stack);
        handler(1, 'uncaughtException');
    });

    process.on('unhandledRejection', (e) => {
        console.error(e.stack);
        handler(1, 'unhandledRejection');
    });
}
