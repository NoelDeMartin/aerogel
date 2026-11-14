import { Cache } from '@aerogel/core';
import Book from '@aerogel/plugin-solid/testing/stubs/models/Book';
import Chapter from '@aerogel/plugin-solid/testing/stubs/models/Chapter';
import Item from '@aerogel/plugin-solid/testing/stubs/models/Item';
import Post from '@aerogel/plugin-solid/testing/stubs/models/Post';
import Shelf from '@aerogel/plugin-solid/testing/stubs/models/Shelf';
import Task from '@aerogel/plugin-solid/testing/stubs/models/Task';
import User from '@aerogel/plugin-solid/testing/stubs/models/User';
import { after, arrayGroupBy } from '@noeldemartin/utils';
import type { SerializedModel } from 'soukai-bis';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { nextTick, ref, toRaw, watchEffect } from 'vue';

import { computedModel, computedModels, useModels, useSingletonModel } from './composition';
import { _getTrackedModelsData } from './internal';
import { getTrackedModels, loadTrackedModels, refreshTrackedModels, resetModelsState, trackModels } from './services';

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

    it('Reacts to relation changes in singleton models', async () => {
        // Arrange
        const chaptersCount: number[] = [];
        const book = await Book.create({ title: 'Lorem ipsum' });

        await Chapter.create({ name: 'Chapter 1', bookUrl: book.url });

        const { model, loading } = useSingletonModel(Book);

        await vi.waitFor(() => expect(loading.value).toBe(false));

        watchEffect(() => chaptersCount.push(model.value?.getRelation('chapters').getLoadedModels().length ?? 0));

        // Act
        await toRaw(model.value)?.loadRelation('chapters');

        // Assert
        await vi.waitFor(() => expect(chaptersCount).toEqual([0, 1]));
    });

    it('Includes soft-deleted models on demand', async () => {
        // Arrange
        const task = await Task.create({ name: 'Soft-deleted' });

        await Task.create({ name: 'Active' });
        await task.softDelete();

        // Act
        const { models: activeTasks, loading } = useModels(Task);
        const { models: allTasks } = useModels(Task, { includeSoftDeleted: true });

        // Assert
        await vi.waitFor(() => expect(loading.value).toBe(false));

        expect(activeTasks.value.map(({ name }) => name)).toEqual(['Active']);
        expect(allTasks.value.map(({ name }) => name)).toEqual(['Soft-deleted', 'Active']);
    });

    it('Reacts to relation changes in model collections', async () => {
        // Arrange
        const itemsCount: number[] = [];
        const shelf = await Shelf.create({ name: 'Shelf' });

        await Item.create({ name: 'Item', shelfUrl: shelf.url });

        const { models: shelves, loading } = useModels(Shelf);

        await vi.waitFor(() => expect(loading.value).toBe(false));

        watchEffect(() => itemsCount.push(shelves.value[0]?.getRelation('items').getLoadedModels().length ?? 0));

        // Act
        await toRaw(shelves.value[0])?.loadRelation('items');

        // Assert
        await vi.waitFor(() => expect(itemsCount.at(-1)).toBe(1));
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
            { watch: ['titleLength'] },
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
            { cache: 'users' },
        );

        // Act
        await vi.waitFor(() => expect(loading.value).toBe(false));

        // Assert
        await vi.waitFor(async () => expect(await Cache.get('users')).toBeTruthy());

        const cached = await Cache.get<{
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
        await Cache.set('users', { count: 1, ages: new Map([['Alice', 23]]) });

        const ready = ref(false);
        const { models: users } = useModels(User);
        const stats = computedModels(
            User,
            () =>
                ready.value
                    ? { count: users.value.length, ages: new Map(users.value.map((user) => [user.name, user.age])) }
                    : null,
            { cache: 'users' },
        );

        // Act
        await vi.waitFor(() => expect(stats.value?.count).toEqual(1));
        await after(600);

        const cachedStats = stats.value;
        const cachedValue = await Cache.get('users');

        ready.value = true;

        // Assert
        expect(cachedStats?.ages).toEqual(new Map([['Alice', 23]]));
        expect(cachedValue).toEqual({ count: 1, ages: new Map([['Alice', 23]]) });

        await vi.waitFor(() => expect(stats.value?.count).toEqual(2));
        await vi.waitFor(async () => expect(await Cache.get('users')).toMatchObject({ count: 2 }));
    });

    it('Falls back to last known values when computing nullish values again', async () => {
        // Arrange
        await User.create({ name: 'Alice', age: 23 });
        await Cache.set('users', { count: 0 });

        const ready = ref(true);
        const { models: users, loading } = useModels(User);
        const stats = computedModels(User, () => (ready.value ? { count: users.value.length } : null), {
            cache: 'users',
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

        await Cache.set('alice', [{ '@model': alice.serialize() }]);
        await Cache.set('users', [{ '@model': alice.serialize() }]);
        await trackModels(User, { bypassServicesCheck: true, lazy: true });

        // Act
        const cachedAlice = computedModels(User, () => null as User[] | null, { cache: 'alice' });
        const cachedUsers = computedModels(User, () => null as User[] | null, { cache: 'users' });

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

        await Cache.set('users', [{ '@model': alice.serialize() }]);
        await trackModels(User, { bypassServicesCheck: true, lazy: true });
        await loadTrackedModels(User);

        // Act
        const users = computedModels(User, () => null as User[] | null, { cache: 'users' });

        await vi.waitFor(() => expect(users.value).toHaveLength(1));

        // Assert
        expect(toRaw(users.value?.[0])).toBe(getTrackedModels(User)[0]);
    });

    it('Loads specified urls without loading the full collection', async () => {
        // Arrange
        const alice = await User.create({ name: 'Alice', age: 23 });
        const bob = await User.create({ name: 'Bob', age: 30 });
        const findSpy = vi.spyOn(User, 'find');
        const allSpy = vi.spyOn(User, 'all');

        // Act - Initial call
        const { models: users, loading } = useModels(User, { urls: [alice.requireUrl()] });

        await vi.waitFor(() => expect(loading.value).toBe(false));

        // Assert
        expect(users.value.map((user) => user.url)).toEqual([alice.url]);
        expect(_getTrackedModelsData(User).loaded.value).toBe(false);
        expect(getTrackedModels(User).map((user) => user.url)).toEqual([alice.url]);
        expect(findSpy).toHaveBeenCalledTimes(1);
        expect(findSpy).toHaveBeenCalledWith(alice.url, { includeSoftDeleted: true });
        expect(allSpy).not.toHaveBeenCalled();

        // Act - Call with a new url
        const { models: bothUsers, loading: loadingBoth } = useModels(User, {
            urls: [alice.requireUrl(), bob.requireUrl()],
        });

        await vi.waitFor(() => expect(loadingBoth.value).toBe(false));

        // Assert
        expect(bothUsers.value.map((user) => user.url)).toEqual([alice.url, bob.url]);
        expect(findSpy).toHaveBeenCalledTimes(2);
        expect(findSpy).toHaveBeenLastCalledWith(bob.url, { includeSoftDeleted: true });
    });

    it('Keeps separate loading states for filtered useModels calls', async () => {
        // Arrange
        const alice = await User.create({ name: 'Alice', age: 23 });
        const bob = await User.create({ name: 'Bob', age: 30 });
        let resolveBob!: () => void;
        const originalFind = User.find.bind(User);

        vi.spyOn(User, 'find').mockImplementation((url: string, options) => {
            if (url === bob.url) {
                return new Promise((resolve) => {
                    resolveBob = () => resolve(originalFind(url, options));
                });
            }

            return originalFind(url, options);
        });

        // Act
        const { models: aliceModels, loading: loadingAlice } = useModels(User, { urls: [alice.requireUrl()] });
        const { models: bobModels, loading: loadingBob } = useModels(User, { urls: [bob.requireUrl()] });

        await vi.waitFor(() => expect(loadingAlice.value).toBe(false));

        // Assert
        expect(aliceModels.value.map((user) => user.url)).toEqual([alice.url]);
        expect(loadingBob.value).toBe(true);
        expect(bobModels.value).toHaveLength(0);

        resolveBob();

        await vi.waitFor(() => expect(loadingBob.value).toBe(false));
        expect(bobModels.value.map((user) => user.url)).toEqual([bob.url]);
    });

    it('Reacts to changes in a urls ref', async () => {
        // Arrange
        const alice = await User.create({ name: 'Alice', age: 23 });
        const bob = await User.create({ name: 'Bob', age: 30 });
        const findSpy = vi.spyOn(User, 'find');
        const allSpy = vi.spyOn(User, 'all');
        const urls = ref<string[]>([]);

        // Act - Initial empty ref
        const { models: users, loading } = useModels(User, { urls });

        // Assert
        expect(loading.value).toBe(false);
        expect(users.value).toEqual([]);
        expect(findSpy).not.toHaveBeenCalled();
        expect(allSpy).not.toHaveBeenCalled();

        // Act - Add first url
        urls.value = [alice.requireUrl()];
        await vi.waitFor(() => expect(loading.value).toBe(false));

        // Assert
        expect(users.value.map((user) => user.url)).toEqual([alice.url]);
        expect(findSpy).toHaveBeenCalledTimes(1);
        expect(findSpy).toHaveBeenCalledWith(alice.url, { includeSoftDeleted: true });

        // Act - Mutate array in-place to add second url
        urls.value.push(bob.requireUrl());
        await nextTick();
        await vi.waitFor(() => expect(loading.value).toBe(false));

        // Assert
        expect(users.value.map((user) => user.url)).toEqual([alice.url, bob.url]);
        expect(findSpy).toHaveBeenCalledTimes(2);
        expect(findSpy).toHaveBeenLastCalledWith(bob.url, { includeSoftDeleted: true });

        // Act - Shrink urls ref to already-loaded model
        urls.value = [bob.requireUrl()];
        await nextTick();

        // Assert
        expect(users.value.map((user) => user.url)).toEqual([bob.url]);
        expect(findSpy).toHaveBeenCalledTimes(2);
        expect(allSpy).not.toHaveBeenCalled();
    });

    it('Keeps loading true until the latest urls ref update finishes', async () => {
        // Arrange
        const alice = await User.create({ name: 'Alice', age: 23 });
        const bob = await User.create({ name: 'Bob', age: 30 });
        let resolveAlice!: () => void;
        let resolveBob!: () => void;
        const originalFind = User.find.bind(User);
        const findSpy = vi.spyOn(User, 'find').mockImplementation((url: string, options) => {
            if (url === alice.url) {
                return new Promise((resolve) => {
                    resolveAlice = () => resolve(originalFind(url, options));
                });
            }

            if (url === bob.url) {
                return new Promise((resolve) => {
                    resolveBob = () => resolve(originalFind(url, options));
                });
            }

            return originalFind(url, options);
        });
        const urls = ref([alice.requireUrl()]);

        // Act
        const { models: users, loading } = useModels(User, { urls });

        expect(loading.value).toBe(true);

        urls.value = [bob.requireUrl()];
        await nextTick();

        expect(loading.value).toBe(true);

        // Resolve the first request while the second is still pending
        resolveAlice();
        await findSpy.mock.results[0]?.value;
        await after(0);

        expect(loading.value).toBe(true);

        resolveBob();
        await vi.waitFor(() => expect(loading.value).toBe(false));

        expect(users.value.map((user) => user.url)).toEqual([bob.url]);
    });
});
