<template>
    <h2>Data Management</h2>
    <ul>
        <li v-for="task of tasks">{{ task.name }}</li>
    </ul>
    <input v-model="newTask" @keyup.enter="addTask()" />
    <button type="button" @click="addTask()">Add</button>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

import Task from '@/models/Task';

const newTask = ref('');
const tasks = ref<Task[]>([]);

async function addTask() {
    const task = await Task.create({ name: newTask.value });

    tasks.value.push(task);

    newTask.value = '';
}

onMounted(async () => {
    const persistentTasks = await Task.all();

    tasks.value.push(...persistentTasks);
});
</script>
