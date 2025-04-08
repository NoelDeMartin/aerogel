<template>
    <ul role="list" class="mt-4 space-y-3">
        <li
            v-for="task of tasks"
            :key="task.id"
            class="flex justify-between overflow-hidden rounded-md bg-gray-100 px-6 py-4 shadow-2xs"
        >
            <Markdown :text="task.name" />

            <Button
                small
                color="danger"
                :aria-label="$t('storage.deleteTask_a11y', { task: task.name })"
                @click="$emit('delete', task)"
            >
                {{ $t('storage.deleteTask') }}
            </Button>
        </li>
    </ul>
    <Form class="mt-5 flex justify-center" :form="form" @submit="($emit('create', form.draft), form.reset())">
        <Input
            name="draft"
            class="mr-2 h-full w-full sm:max-w-xs"
            input-class="h-full"
            wrapper-class="h-full"
            :aria-label="$t('storage.taskName')"
            :placeholder="$t('storage.newTask')"
        />
        <Button submit>
            {{ $t('storage.submit') }}
        </Button>
    </Form>
</template>

<script setup lang="ts">
import { requiredStringInput, useForm } from '@aerogel/core';

import type ITask from '@/models/ITask';

defineProps<{ tasks: ITask[] }>();
defineEmits<{
    create: [value: string];
    delete: [task: ITask];
}>();

const form = useForm({ draft: requiredStringInput() });
</script>
