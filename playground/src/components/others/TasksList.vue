<template>
    <ul role="list" class="mt-4 space-y-3">
        <li
            v-for="task of tasks"
            :key="task.url"
            class="shadow-2xs flex justify-between overflow-hidden rounded-md bg-gray-100 px-6 py-4"
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
    <Form class="mt-5 flex justify-center" :form @submit="($emit('create', form.draft), form.reset())">
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

import type SolidTask from '@/models/SolidTask';

defineProps<{ tasks: SolidTask[] }>();
defineEmits<{
    create: [value: string];
    delete: [task: SolidTask];
}>();

const form = useForm({ draft: requiredStringInput() });
</script>
