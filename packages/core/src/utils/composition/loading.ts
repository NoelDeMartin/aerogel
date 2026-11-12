import { sleep } from '@noeldemartin/utils';
import { ref } from 'vue';

// oxlint-disable-next-line typescript/explicit-module-boundary-types
export function useLoading(options: { min?: number; delay?: number } = {}) {
    const loading = ref(false);
    const min = options.min ?? (options.delay ? 0 : 1000);
    const delay = options.delay ?? 0;

    return {
        loading,
        async run(
            ...callbacks: Array<Promise<unknown> | Function | Array<Promise<unknown>> | Array<Function>>
        ): Promise<void> {
            const flatCallbacks = callbacks.map((callback) => (Array.isArray(callback) ? callback : [callback])).flat();
            const delayTimeout = delay ? setTimeout(() => (loading.value = true), delay) : void (loading.value = true);

            try {
                await Promise.all(
                    [sleep(min)].concat(
                        flatCallbacks.map((callback) => (callback instanceof Function ? callback() : callback)),
                    ),
                );
            } finally {
                delayTimeout && clearTimeout(delayTimeout);

                loading.value = false;
            }
        },
    };
}
