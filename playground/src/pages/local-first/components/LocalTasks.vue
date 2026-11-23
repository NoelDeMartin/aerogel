<template>
    <TasksList
        :tasks
        @create="(name: string) => LocalTask.create({ name })"
        @delete="(task: LocalTask) => task.delete()"
    />
</template>

<script setup lang="ts">
import { useModels } from '@aerogel/reactivity';

import LocalTask from '@/models/LocalTask';

const { models: tasks } = useModels(LocalTask);
</script>
