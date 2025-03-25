<template>
    <TasksList
        :tasks="$offlineTasks.tasks"
        @create="(name: string) => OfflineTask.create({ name })"
        @delete="(task: OfflineTask) => task.softDelete()"
    />
</template>

<script setup lang="ts">
import OfflineTask from '@/models/OfflineTask';
</script>
