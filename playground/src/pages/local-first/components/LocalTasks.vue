<template>
    <TasksList
        :tasks
        @create="(name: string) => LocalTask.create({ name })"
        @delete="(task: LocalTask) => task.delete()"
    />
</template>

<script setup lang="ts">
import { useModelCollection } from '@aerogel/plugin-soukai';

import LocalTask from '@/models/LocalTask';

const tasks = useModelCollection(LocalTask);
</script>
