<template>
    <TasksList
        :tasks="tasks"
        @create="(name: string) => SolidTask.create({ name })"
        @delete="(task: SolidTask) => task.delete()"
    />
</template>

<script setup lang="ts">
import SolidTask from '@/models/SolidTask';
import { useModelCollection } from '@aerogel/plugin-soukai';

const tasks = useModelCollection(SolidTask);
</script>
