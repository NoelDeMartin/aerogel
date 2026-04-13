<template>
    <PageTitle source="src/pages/Storage.vue">
        {{ $t('storage.title') }}
    </PageTitle>

    <TasksList
        :tasks="tasks"
        @create="(name: string) => LocalTask.create({ name })"
        @delete="(task: LocalTask) => task.delete()"
    />
</template>

<script setup lang="ts">
import { useModelCollection } from '@aerogel/plugin-solid';

import LocalTask from '@/models/LocalTask';

const tasks = useModelCollection(LocalTask);
</script>
