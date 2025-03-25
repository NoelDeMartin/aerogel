<template>
    <PageTitle source="src/pages/Storage.vue">
        {{ $t('storage.title') }}
    </PageTitle>

    <TasksList
        :tasks="tasks"
        @create="(name: string) => Task.create({ name })"
        @delete="(task: Task) => task.delete()"
    />
</template>

<script setup lang="ts">
import { useModelCollection } from '@aerogel/plugin-soukai';

import Task from '@/models/Task';

const tasks = useModelCollection(Task);
</script>
