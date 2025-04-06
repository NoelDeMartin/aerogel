<template>
    <HeadlessInput
        ref="$input"
        :name="name"
        :class="className"
        :label="label"
    >
        <HeadlessInputInput
            v-bind="attrs"
            type="checkbox"
        />
        <div v-if="$slots.default">
            <HeadlessInputLabel>
                <slot />
            </HeadlessInputLabel>
            <HeadlessInputError />
        </div>
    </HeadlessInput>
</template>

<script setup lang="ts">
import { HeadlessInputLabel, componentRef, stringProp, useInputAttrs } from '@aerogel/core';
import type { IHeadlessInput } from '@aerogel/core';

defineOptions({ inheritAttrs: false });
defineProps({
    name: stringProp(),
    label: stringProp(),
    inputClass: stringProp(''),
});

const $input = componentRef<IHeadlessInput>();
const [attrs, className] = useInputAttrs();
</script>
