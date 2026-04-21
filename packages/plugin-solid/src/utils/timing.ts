export function throttle(callback: () => unknown, delay: number = 100): () => void {
    let hasTrailingCall = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    function throttledCallback() {
        if (timeoutId) {
            hasTrailingCall = true;

            return;
        }

        callback();

        timeoutId = setTimeout(() => {
            const hadTrailingCall = hasTrailingCall;

            hasTrailingCall = false;
            timeoutId = null;

            hadTrailingCall && throttledCallback();
        }, delay);
    }

    return throttledCallback;
}
