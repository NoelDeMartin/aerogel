<template>
    <TasksList
        :tasks="$localTasks.all"
        @create="(name: string) => LocalTask.create({ name })"
        @delete="(task: LocalTask) => task.softDelete()"
    />
</template>

<script setup lang="ts">
import LocalTask from '@/models/LocalTask';
</script>
