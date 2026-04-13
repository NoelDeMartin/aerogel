import { arrayGroupBy } from '@noeldemartin/utils';
import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryEngine, bootCoreModels, bootModels, setEngine } from 'soukai-bis';
import { ref, watchEffect } from 'vue';

import User from '@aerogel/plugin-solid/testing/stubs/models/User';

import { computedModels } from './composition';

describe('Composition helpers', () => {

    beforeEach(() => {
        bootModels({ User });
        bootCoreModels({ reset: true });
        setEngine(new InMemoryEngine());
    });

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

        // TODO This should be 3
        expect(collectionUpdated).toEqual(10);

        // TODO This should be 2
        expect(aliceUpdated).toEqual(1);
    });

});
