<template>
    <h2 class="text-xl">
        Data Management
    </h2>
    <ul role="list" class="mt-4 space-y-3">
        <li
            v-for="task of tasks"
            :key="task.id"
            class="flex justify-between overflow-hidden rounded-md bg-white px-6 py-4 shadow"
        >
            <span>{{ task.name }}</span>

            <button
                type="button"
                class="rounded bg-red-600 px-2 py-1 text-xs font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                :aria-label="`Delete '${task.name}'`"
                @click="task.delete()"
            >
                delete
            </button>
        </li>
    </ul>
    <form class="mt-5 sm:flex sm:items-center" @submit.prevent="addTask">
        <div class="w-full sm:max-w-xs">
            <label for="draft" class="sr-only">Task name</label>
            <input
                id="draft"
                v-model="draft"
                type="text"
                class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder="New task"
            >
        </div>
        <button
            type="submit"
            class="mt-3 inline-flex w-full items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:ml-3 sm:mt-0 sm:w-auto"
        >
            Add
        </button>
    </form>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { arrayRemove } from '@noeldemartin/utils';

import Task from '@/models/Task';

const draft = ref('');
const tasks = ref<Task[]>([]);

async function addTask() {
    if (!draft.value) {
        return;
    }

    const task = await Task.create({ name: draft.value });

    tasks.value.push(task);

    draft.value = '';
}

onMounted(() => Task.on('deleted', (task) => arrayRemove(tasks.value, task)));
onMounted(async () => {
    const persistentTasks = await Task.all();

    tasks.value.push(...persistentTasks);
});
</script>
