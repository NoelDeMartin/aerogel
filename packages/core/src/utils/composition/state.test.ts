import { after } from '@noeldemartin/utils';
import { describe, expect, it } from 'vitest';
import { ref } from 'vue';

import { computedDebounce } from './state';

describe('Vue state helpers', () => {

    it('computes debounced state', async () => {
        // Initial
        const state = ref(0);
        const value = computedDebounce({ delay: 90 }, () => state.value);

        expect(value.value).toBe(null);

        await after({ ms: 100 });

        expect(value.value).toBe(0);

        // Update
        state.value = 42;

        expect(value.value).toBe(0);

        await after({ ms: 100 });

        expect(value.value).toBe(42);

        // Debounced Update
        state.value = 23;

        expect(value.value).toBe(42);

        await after({ ms: 50 });

        state.value = 32;

        await after({ ms: 50 });

        expect(value.value).toBe(42);

        await after({ ms: 100 });

        expect(value.value).toBe(32);
    });

});
