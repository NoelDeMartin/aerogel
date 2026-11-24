# Standalone Reactivity

If you are building a Vue application but don't want to use the complete Aerogel stack, you can use `@aerogel/reactivity` to get the core reactive primitives that work with [Soukai](https://soukai.js.org/next/).

## Installation

Install the package alongside Soukai and Vue:

```sh
npm install @aerogel/reactivity soukai-bis vue
```

Make sure to [configure Soukai as usual](https://soukai.js.org/next/guide/getting-started/configuration.html), and then you can start using the composables right away.

## useModels()

You can use the `useModels()` composable to read all the models of a class:

```vue
<script setup lang="ts">
import { useModels } from '@aerogel/reactivity';

import Task from '@/models/Task';

const { models: tasks, loading } = useModels(Task);
</script>

<template>
    <p v-if="loading">Loading...</p>
    <ul v-else>
        <li v-for="task of tasks" :key="task.url">{{ task.name }}</li>
    </ul>
</template>
```

Models are read from the [default container](https://soukai.js.org/next/guide/core-concepts/models.html#default-container) of the class the first time they are used. After that, they are kept in memory and reused with every component using the same class. Whenever a model is created, updated, or deleted, the collection will be updated and trigger reactive changes.

Besides `models` and `loading`, it also returns `refreshing`. The difference is that `loading` will only be `true` while models are read for the first time, whereas `refreshing` will also be `true` when they are being updated (for example, after [synchronization](#local-first)).

### Other helpers

The model collections can also be accessed by the following helpers:

- `trackModels(Task)`: Starts tracking a collection, without reading it.
- `loadTrackedModels(Task)`: Reads the models of a collection, if they haven't been read already.
- `getTrackedModels(Task)`: Returns the models in a collection.
- `findTrackedModel(Task, url)`: Returns a model from a collection, or reads it if it hasn't been read yet.
- `refreshTrackedModels(Task)`: Updates the models of a collection (reads from the engine again).

## Computed values

Model instances aren't reactive out of the box, so using them in Vue's `computed` won't react to changes in their attributes. Instead, you should use `computedModels`:

```ts
import { computedModels, useModels } from '@aerogel/reactivity';

const { models: tasks } = useModels(Task);
const pendingTasks = computedModels(Task, () => {
    return tasks.value.filter((task) => !task.completed);
});
```

You can also pass an array of classes, if the value depends on more than one. Models returned by the function will be reactive, so you can use them in your templates as usual.

It accepts the following options:

- `watchComputedAttributes`: The [computed attributes](https://soukai.js.org/next/guide/advanced/caching.html) used in the function, so that it's updated when their values change.
- `cacheKey`: Caches the value, so that it's available right away the next time the application is opened. This requires [configuring a cache](#configuration).
- `includeSoftDeleted`: Include soft deleted models in the value.

Similarly, you can use `computedModel` for values that return a single model:

```ts
const props = defineProps<{ url: string }>();
const { models: tasks } = useModels(Task);
const task = computedModel(() => {
    return tasks.value.find((task) => task.url === props.url) ?? null;
});
```

And `computedModelAttribute` to watch the value of a computed attribute:

```ts
const postTitles = computedModelAttribute(() => props.user, 'postTitles');
```

## Local-first

If you're building a [local-first](https://soukai.js.org/next/guide/advanced/local-first.html) application, you should boot the Sync service using `bootSync` instead of `Sync.boot`. It accepts the same options:

```ts
import { bootSync } from '@aerogel/reactivity';
import { IndexedDBEngine, LocalStorageSyncStorageProvider, setEngine } from 'soukai-bis';

setEngine(new IndexedDBEngine());

await bootSync({
    models: [{ model: Task, registration: true }],
    storageProvider: new LocalStorageSyncStorageProvider(),
});
```

This way, collections will be read from the containers used by the Sync service, and refreshed every time a synchronization is completed. Other than that, you can continue using the `Sync` service to connect, setup, synchronize, and disconnect as usual.

In order to display the synchronization status, you can use `useSyncSession` and `useLocalChanges`:

```vue
<script setup lang="ts">
import { useLocalChanges, useSyncSession } from '@aerogel/reactivity';

const session = useSyncSession();
const { count: localChangesCount } = useLocalChanges();
</script>

<template>
    <p v-if="!session.connected">Not connected</p>
    <p v-else-if="!session.online">Offline</p>
    <p v-else-if="session.syncing">Syncing...</p>
    <p v-else-if="session.error">Sync failed</p>
    <p v-else-if="localChangesCount > 0">{{ localChangesCount }} pending changes</p>
    <p v-else>Up to date</p>
</template>
```

`useSyncSession` returns a reactive copy of the [sync state](https://soukai.js.org/next/guide/advanced/local-first.html#state-updates), and `useLocalChanges` returns the number of local changes that haven't been pushed (`count`), and whether there are any (`dirty`).

## Configuration

There are a couple of optional settings that you can configure when your application starts:

- `setErrorReporter`: By default, errors that happen in the background (such as reading collections) are logged in the console. You can use this function to report them somewhere else.
- `setComputedModelsCache`: Configures the cache used by the `cacheKey` option of `computedModels`. It's an object with async `get(key)` and `set(key, value)` methods, so you could implement it using IndexedDB or `localStorage`.
- `setModelsWorkerLoader`: When using the `IndexedDBEngine`, large collections (more than 100 documents) can be read in a [Web Worker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API) to avoid blocking the UI. This function receives a factory that returns an object implementing the `ModelsWorker` interface.
