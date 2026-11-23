import { computedModel } from '@aerogel/reactivity/composables/computedModel';
import { resetModelsState } from '@aerogel/reactivity/lib/tracking';
import User from '@aerogel/reactivity/testing/stubs/models/User';
import { beforeEach, describe, expect, it } from 'vite-plus/test';
import { nextTick, toRaw, watchEffect } from 'vue';

describe('computedModel', () => {
    beforeEach(() => resetModelsState());

    it('Computes model instances', async () => {
        // Arrange
        let aliceUpdated = 0;
        const alice = await User.create({ name: 'Alice', age: 23 });
        const reactiveAlice = computedModel(() => alice);

        watchEffect(() => {
            reactiveAlice.value;
            aliceUpdated++;
        });

        // Act & Assert
        await alice.update({ name: 'Alice Cooper' });
        await nextTick();

        expect(toRaw(reactiveAlice.value)).toBe(alice);
        expect(reactiveAlice.value.name).toEqual('Alice Cooper');

        // FIXME This should be 1
        expect(aliceUpdated).toEqual(2);
    });
});
