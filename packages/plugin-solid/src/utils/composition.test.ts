import User from '@aerogel/plugin-solid/testing/stubs/models/User';
import { arrayGroupBy } from '@noeldemartin/utils';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { nextTick, ref, toRaw, watchEffect } from 'vue';

import { computedModel, computedModels, useModels } from './composition';
import { refreshTrackedModels, resetModelsState } from './services';

describe('Composition helpers', () => {
    beforeEach(() => resetModelsState());

    it('Computes model collections', async () => {
        // Arrange
        let reactiveAlice: User | undefined;
        let collectionUpdated = 0;
        let aliceUpdated = 0;
        const allUsers = ref<User[]>([]);
        const usersByAge = computedModels(User, () => arrayGroupBy(allUsers.value ?? [], 'age'));

        User.on('created', async () => (allUsers.value = await User.all()));

        const alice = await User.create({ name: 'Alice', age: 23 });

        watchEffect(() => {
            reactiveAlice = Object.values(usersByAge.value)
                .flat()
                .find((user) => user.url === alice.url) as User | undefined;

            collectionUpdated++;
        });

        watchEffect(() => {
            reactiveAlice?.name;

            aliceUpdated++;
        });

        // Act
        await alice.update({ age: 24 });

        // TODO Updates that don't actually change anything shouldn't trigger any effects
        // await alice.update({ age: 24 });

        await alice.update({ age: 25 });

        const bob = await User.create({ name: 'bob', age: 23 });

        // Assert
        expect(Object.keys(usersByAge.value)).toEqual(['23', '25']);
        expect(usersByAge.value[23]).toHaveLength(1);
        expect(usersByAge.value[23]?.[0]?.url === bob.url).toBe(true);
        expect(usersByAge.value[25]).toHaveLength(1);
        expect(usersByAge.value[25]?.[0]?.url === alice.url).toBe(true);

        // FIXME This should be 3
        expect(collectionUpdated).toEqual(10);

        // FIXME This should be 2
        expect(aliceUpdated).toEqual(1);
    });

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

    it('Loads model collections on demand', async () => {
        // Arrange
        await User.create({ name: 'Alice', age: 23 });

        // Act
        const { models: users, loading, refreshing } = useModels(User);

        // Assert
        expect(loading.value).toBe(true);
        expect(refreshing.value).toBe(true);

        await vi.waitFor(() => expect(loading.value).toBe(false));

        expect(refreshing.value).toBe(false);

        expect(users.value.map((user) => user.name)).toEqual(['Alice']);

        await User.create({ name: 'Bob', age: 30 });

        expect(users.value).toHaveLength(2);
    });

    it('Refreshes model collections without loading', async () => {
        // Arrange
        await User.create({ name: 'Alice', age: 23 });

        const { loading, refreshing } = useModels(User);

        await vi.waitFor(() => expect(loading.value).toBe(false));

        // Act
        const refresh = refreshTrackedModels(User);

        // Assert
        expect(loading.value).toBe(false);
        expect(refreshing.value).toBe(true);

        await refresh;

        expect(loading.value).toBe(false);
        expect(refreshing.value).toBe(false);
    });
});
