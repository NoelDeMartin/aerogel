<template>
    <div class="relative" :class="{ 'pointer-events-none!': disabled && !editing }">
        <div v-if="!editing" :class="renderedContentClass">
            <slot />
        </div>
        <span v-else :class="renderedFillerClass">
            {{ draft }}
        </span>
        <span v-if="type === 'number'" class="inline-block transition-[width]" :class="editing ? 'w-5' : 'w-0'" />
        <form class="w-full" :aria-hidden="formAriaHidden" @submit.prevent="$input?.blur()">
            <input
                ref="$input"
                v-model="draft"
                :tabindex="tabindex ?? undefined"
                :aria-label="ariaLabel ?? undefined"
                :type
                :class="[
                    renderedInputClass,
                    { 'opacity-0': !editing, 'appearance-textfield': !editing && type === 'number' },
                ]"
                @keyup="$emit('update', draft)"
                @focus="startEditing()"
                @blur="stopEditing()"
            >
        </form>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue';
import type { HTMLAttributes } from 'vue';

import { classes } from '@aerogel/core/components/utils';

const emit = defineEmits<{ update: [value: string | number]; save: [] }>();
const {
    type = 'text',
    text,
    contentClass,
    ariaLabel,
    formAriaHidden,
    tabindex,
    disabled,
} = defineProps<{
    type?: string;
    contentClass?: HTMLAttributes['class'];
    ariaLabel?: string;
    formAriaHidden?: boolean;
    tabindex?: string;
    text: string;
    disabled?: boolean;
}>();
const $input = ref<HTMLElement>();
const editing = ref<string | null>(null);
const draft = ref(text);
const renderedContentClass = computed(() => classes('inline whitespace-pre', contentClass));
const renderedFillerClass = computed(() => classes('invisible whitespace-pre', contentClass));
const renderedInputClass = computed(() =>
    classes('absolute inset-0 h-full w-full resize-none border-0 bg-transparent p-0 focus:ring-0', contentClass));

function startEditing() {
    editing.value = text;
}

function stopEditing() {
    if (!editing.value) {
        return;
    }

    if (type !== 'number' && draft.value.trim().length === 0) {
        draft.value = editing.value;

        emit('update', draft.value);
    }

    editing.value = null;

    emit('save');
}

watchEffect(() => (draft.value = text));
</script>
