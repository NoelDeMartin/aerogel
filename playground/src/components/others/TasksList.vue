<template>
    <ul role="list" class="mt-4 space-y-3">
        <li
            v-for="task of tasks"
            :key="task.id"
            class="flex justify-between overflow-hidden rounded-md bg-white px-6 py-4 shadow"
        >
            <AGMarkdown :text="task.name" />

            <BaseButton
                small
                color="danger"
                :aria-label="$t('storage.deleteTask_a11y', { task: task.name })"
                @click="$emit('delete', task)"
            >
                {{ $t('storage.deleteTask') }}
            </BaseButton>
        </li>
    </ul>
    <AGForm class="mt-5 flex justify-center" :form="form" @submit="($emit('create', form.draft), form.reset())">
        <BaseInput
            name="draft"
            class="mr-2 h-full w-full sm:max-w-xs"
            input-class="h-full"
            wrapper-class="h-full"
            :aria-label="$t('storage.taskName')"
            :placeholder="$t('storage.newTask')"
        />
        <BaseButton submit>
            {{ $t('storage.submit') }}
        </BaseButton>
    </AGForm>
</template>

<script setup lang="ts">
import { requiredArrayProp, requiredStringInput, useForm } from '@aerogel/core';

import type ITask from '@/models/ITask';

defineProps({ tasks: requiredArrayProp<ITask>() });
defineEmits(['create', 'delete']);

const form = useForm({ draft: requiredStringInput() });
</script>
