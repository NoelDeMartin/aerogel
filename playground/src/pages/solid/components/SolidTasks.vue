<template>
    <TasksList
        :tasks="tasks"
        @create="(name: string) => SolidTask.create({ name })"
        @delete="(task: SolidTask) => task.delete()"
    />
</template>

<script setup lang="ts">
import { useModels } from '@aerogel/plugin-solid';

import SolidTask from '@/models/SolidTask';

const { models: tasks } = useModels(SolidTask);
</script>
