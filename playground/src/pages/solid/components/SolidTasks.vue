<template>
    <TasksList
        :tasks="tasks"
        @create="(name: string) => SolidTask.create({ name })"
        @delete="(task: SolidTask) => task.delete()"
    />
</template>

<script setup lang="ts">
import { useModelCollection } from '@aerogel/plugin-solid';

import SolidTask from '@/models/SolidTask';

const tasks = useModelCollection(SolidTask);
</script>
