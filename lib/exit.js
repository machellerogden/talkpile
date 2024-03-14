export const exitController = new AbortController();
export const exitSignal = exitController.signal;

export function exit(ms = 0) {
    exitController.timeout(ms);
}
