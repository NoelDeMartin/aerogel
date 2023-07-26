<template>
    <PageTitle source="src/pages/Storage.vue">
        {{ $t('storage.title') }}
    </PageTitle>
    <ul role="list" class="mt-4 space-y-3">
        <li
            v-for="task of tasks"
            :key="task.id"
            class="flex justify-between overflow-hidden rounded-md bg-white px-6 py-4 shadow"
        >
            <span>{{ task.name }}</span>

            <BaseButton
                small
                color="danger"
                :aria-label="$t('storage.deleteTask_a11y', { task: task.name })"
                @click="task.delete()"
            >
                {{ $t('storage.deleteTask') }}
            </BaseButton>
        </li>
    </ul>
    <AGForm class="mt-5 flex justify-center" :form="form" @submit="addTask">
        <BaseInput
            name="draft"
            class="h-full"
            wrapper-class="h-full"
            host-class="mr-2 h-full w-full sm:max-w-xs"
            :aria-label="$t('storage.taskName')"
            :placeholder="$t('storage.newTask')"
        />
        <BaseButton submit>
            {{ $t('storage.submit') }}
        </BaseButton>
    </AGForm>
</template>

<script setup lang="ts">
import { arrayRemove } from '@noeldemartin/utils';
import { onCleanMounted, requiredStringInput, useForm } from '@aerogel/core';
import { onMounted, ref } from 'vue';

import Task from '@/models/Task';

const form = useForm({
    draft: requiredStringInput(),
});
const tasks = ref<Task[]>([]);

async function addTask() {
    const task = await Task.create({ name: form.draft });

    tasks.value.push(task);
    form.setFieldValue('draft', '');
}

onCleanMounted(() => Task.on('deleted', (task) => arrayRemove(tasks.value, task)));
onMounted(async () => {
    const persistentTasks = await Task.all();

    tasks.value.push(...persistentTasks);
});
</script>
