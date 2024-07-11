export function useResizeObserver(node, callback) {
    const resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
            callback(entry);
        }
    });

    resizeObserver.observe(node);

    return {
        destroy() {
            resizeObserver.unobserve(node);
            resizeObserver.disconnect();
        }
    };
}
