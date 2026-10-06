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
import { useModels } from '@aerogel/plugin-solid';

import LocalTask from '@/models/LocalTask';

const { models: tasks } = useModels(LocalTask);
</script>
