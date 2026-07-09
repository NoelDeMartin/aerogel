import { sleep } from '@noeldemartin/utils';
import { ref } from 'vue';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function useLoading(options: { min?: number } = {}) {
    const loading = ref(false);
    const min = options.min ?? 1000;

    return {
        loading,
        async run(...callbacks: Array<Promise<unknown> | Function | Array<Promise<unknown>> | Array<Function>>) {
            const flatCallbacks = callbacks.map((callback) => (Array.isArray(callback) ? callback : [callback])).flat();

            loading.value = true;

            try {
                await Promise.all(
                    [sleep(min)].concat(
                        flatCallbacks.map((callback) => (callback instanceof Function ? callback() : callback)),
                    ),
                );
            } finally {
                loading.value = false;
            }
        },
    };
}
