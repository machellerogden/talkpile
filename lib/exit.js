import { EOL } from 'node:os';
import process from 'node:process';

const exitController = new AbortController();
const exitSignal = exitController.signal;

function exit(ms = 0) {
    exitController.timeout(ms);
}

export function shutdown(exitCode, signal) {
    console.log(`${EOL}[${signal}] Handling shutdown.${EOL}`);
    exitCode = exitCode ?? 0;
    if (typeof exitCode !== 'number') exitCode = 1;
    queueMicrotask(() => process.exit(exitCode));
}

const exitSignals = ['SIGINT', 'SIGTERM', 'SIGQUIT', 'SIGHUP'];

export function registerShutdown() {
    exitSignal.addEventListener('abort', () => shutdown(0), { once: true });

    for (const signal of exitSignals) process.on(signal, () => shutdown(0, signal));

    process.on('uncaughtException', (e) => {
        console.error(e.stack);
        shutdown(1, 'uncaughtException');
    });

    process.on('unhandledRejection', (e) => {
        console.error(e.stack);
        shutdown(1, 'unhandledRejection');
    });
}
