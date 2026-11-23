import { computedModels } from '@aerogel/reactivity/composables/computedModels';
import { useModels } from '@aerogel/reactivity/composables/useModels';
import { getTrackedModels, loadTrackedModels, resetModelsState, trackModels } from '@aerogel/reactivity/lib/tracking';
import Post from '@aerogel/reactivity/testing/stubs/models/Post';
import User from '@aerogel/reactivity/testing/stubs/models/User';
import TestingComputedModelsCache from '@aerogel/reactivity/testing/TestingComputedModelsCache';
import { after, arrayGroupBy } from '@noeldemartin/utils';
import type { SerializedModel } from 'soukai-bis';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { nextTick, ref, toRaw, watchEffect } from 'vue';

describe('computedModels', () => {
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
        expect(collectionUpdated).toEqual(8);

        // FIXME This should be 2
        expect(aliceUpdated).toEqual(1);
    });

    it('Defers recomputing model collections until they are read', async () => {
        // Arrange
        const alice = await User.create({ name: 'Alice', age: 23 });
        const compute = vi.fn(() => [alice]);
        const users = computedModels(User, compute);

        users.value;
        compute.mockClear();

        // Act
        alice.setAttribute('name', 'Alicia');
        alice.setAttribute('age', 24);
        await alice.save();

        const computedBeforeReading = compute.mock.calls.length;

        users.value;
        users.value;

        // Assert
        expect(computedBeforeReading).toEqual(0);
        expect(compute).toHaveBeenCalledOnce();
    });

    it('Updates reactive models when their attributes change', async () => {
        // Arrange
        const alice = await User.create({ name: 'Alice', age: 23 });
        const users = computedModels(User, () => [alice]);
        const reactiveAlice = users.value[0];
        const ages: unknown[] = [];

        watchEffect(() => ages.push(reactiveAlice?.age));

        // Act
        alice.setAttribute('age', 24);
        await nextTick();

        await alice.update({ age: 25 });
        await nextTick();

        // Assert
        expect(ages).toEqual([23, 24, 25]);
    });

    it('Computes collections from multiple model classes', async () => {
        // Arrange
        const { models: users } = useModels(User);
        const { models: posts } = useModels(Post);
        const counts = computedModels([User, Post], () => ({
            users: users.value.length,
            posts: posts.value.length,
        }));

        // Act
        await User.create({ name: 'Alice', age: 23 });
        await Post.create({ title: 'Hello World' });

        // Assert
        await vi.waitFor(() => expect(counts.value).toEqual({ users: 1, posts: 1 }));
    });

    it('Watches computed attributes only in the models that define them', async () => {
        // Arrange
        const { models: users } = useModels(User);
        const { models: posts } = useModels(Post);
        const stats = computedModels(
            [User, Post],
            () => ({
                users: users.value.length,
                titleLengths: posts.value.map((post) => post.titleLength.value),
            }),
            { watchComputedAttributes: ['titleLength'] },
        );

        // Act
        await User.create({ name: 'Alice', age: 23 });
        await Post.create({ title: 'Hello World' });

        // Assert
        await vi.waitFor(() => expect(stats.value).toEqual({ users: 1, titleLengths: [11] }));
    });

    it('Caches computed models once updated', async () => {
        // Arrange
        await User.create({ name: 'Alice', age: 23 });
        await User.create({ name: 'Bob', age: 42 });

        const { models: users, loading } = useModels(User);

        computedModels(
            User,
            () => ({
                adults: users.value.filter((user) => (user.age ?? 0) > 30),
                stats: { count: users.value.length, ages: new Map(users.value.map((user) => [user.name, user.age])) },
            }),
            { cacheKey: 'users' },
        );

        // Act
        await vi.waitFor(() => expect(loading.value).toBe(false));

        // Assert
        await vi.waitFor(async () => expect(await TestingComputedModelsCache.get('users')).toBeTruthy());

        const cached = await TestingComputedModelsCache.get<{
            adults: { '@model': SerializedModel }[];
            stats: { count: number; ages: Map<string, number> };
        }>('users');

        expect(cached?.adults).toHaveLength(1);
        expect(cached?.adults[0]?.['@model'].nodes[0]?.attributes.name).toEqual('Bob');
        expect(cached?.stats).toEqual({
            count: 2,
            ages: new Map([
                ['Alice', 23],
                ['Bob', 42],
            ]),
        });
    });

    it('Falls back to cached values while computing nullish values', async () => {
        // Arrange
        await User.create({ name: 'Alice', age: 23 });
        await User.create({ name: 'Bob', age: 42 });
        await TestingComputedModelsCache.set('users', { count: 1, ages: new Map([['Alice', 23]]) });

        const ready = ref(false);
        const { models: users } = useModels(User);
        const stats = computedModels(
            User,
            () =>
                ready.value
                    ? { count: users.value.length, ages: new Map(users.value.map((user) => [user.name, user.age])) }
                    : null,
            { cacheKey: 'users' },
        );

        // Act
        await vi.waitFor(() => expect(stats.value?.count).toEqual(1));
        await after(600);

        const cachedStats = stats.value;
        const cachedValue = await TestingComputedModelsCache.get('users');

        ready.value = true;

        // Assert
        expect(cachedStats?.ages).toEqual(new Map([['Alice', 23]]));
        expect(cachedValue).toEqual({ count: 1, ages: new Map([['Alice', 23]]) });

        await vi.waitFor(() => expect(stats.value?.count).toEqual(2));
        await vi.waitFor(async () => expect(await TestingComputedModelsCache.get('users')).toMatchObject({ count: 2 }));
    });

    it('Falls back to last known values when computing nullish values again', async () => {
        // Arrange
        await User.create({ name: 'Alice', age: 23 });
        await TestingComputedModelsCache.set('users', { count: 0 });

        const ready = ref(true);
        const { models: users, loading } = useModels(User);
        const stats = computedModels(User, () => (ready.value ? { count: users.value.length } : null), {
            cacheKey: 'users',
        });

        await vi.waitFor(() => expect(loading.value).toBe(false));
        await vi.waitFor(() => expect(stats.value).toEqual({ count: 1 }));

        // Act
        ready.value = false;

        await User.create({ name: 'Bob', age: 42 });

        // Assert
        expect(stats.value).toEqual({ count: 1 });
    });

    it('Reuses tracked instances when restoring cached models', async () => {
        // Arrange
        const alice = await User.create({ name: 'Alice', age: 23 });

        await TestingComputedModelsCache.set('alice', [{ '@model': alice.serialize() }]);
        await TestingComputedModelsCache.set('users', [{ '@model': alice.serialize() }]);
        trackModels(User);

        // Act
        const cachedAlice = computedModels(User, () => null as User[] | null, { cacheKey: 'alice' });
        const cachedUsers = computedModels(User, () => null as User[] | null, { cacheKey: 'users' });

        await vi.waitFor(() => expect(cachedAlice.value).toHaveLength(1));
        await vi.waitFor(() => expect(cachedUsers.value).toHaveLength(1));

        const trackedAlice = getTrackedModels(User)[0];

        await loadTrackedModels(User);

        // Assert
        expect(getTrackedModels(User)).toHaveLength(1);
        expect(getTrackedModels(User)[0]).toBe(trackedAlice);
        expect(toRaw(cachedAlice.value?.[0])).toBe(trackedAlice);
        expect(toRaw(cachedUsers.value?.[0])).toBe(trackedAlice);
    });

    it('Reuses loaded instances when restoring cached models', async () => {
        // Arrange
        const alice = await User.create({ name: 'Alice', age: 23 });

        await TestingComputedModelsCache.set('users', [{ '@model': alice.serialize() }]);
        trackModels(User);
        await loadTrackedModels(User);

        // Act
        const users = computedModels(User, () => null as User[] | null, { cacheKey: 'users' });

        await vi.waitFor(() => expect(users.value).toHaveLength(1));

        // Assert
        expect(toRaw(users.value?.[0])).toBe(getTrackedModels(User)[0]);
    });
});
