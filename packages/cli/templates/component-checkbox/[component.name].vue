<template>
    <AGHeadlessInput
        ref="$input"
        :name="name"
        :class="className"
        :label="label"
    >
        <AGHeadlessInputInput
            v-bind="attrs"
            type="checkbox"
        />
        <div v-if="$slots.default">
            <AGHeadlessInputLabel>
                <slot />
            </AGHeadlessInputLabel>
            <AGHeadlessInputError />
        </div>
    </AGHeadlessInput>
</template>

<script setup lang="ts">
import { AGHeadlessInputLabel, componentRef, stringProp, useInputAttrs } from '@aerogel/core';
import type { IAGHeadlessInput } from '@aerogel/core';

defineOptions({ inheritAttrs: false });
defineProps({
    name: stringProp(),
    label: stringProp(),
    inputClass: stringProp(''),
});

const $input = componentRef<IAGHeadlessInput>();
const [attrs, className] = useInputAttrs();
</script>
