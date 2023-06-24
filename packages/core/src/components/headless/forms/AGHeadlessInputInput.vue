<template>
    <input
        ref="$input"
        type="text"
        :value="value"
        :aria-invalid="input.errors ? 'true' : 'false'"
        :aria-describedby="input.errors ? `${input.id}-error` : undefined"
        @input="update"
    >
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

import { injectReactiveOrFail } from '@/utils';
import type { IAGHeadlessInput } from '@/components/headless/forms/AGHeadlessInput';

const $input = ref<HTMLInputElement>();
const input = injectReactiveOrFail<IAGHeadlessInput>('input');
const value = computed(() => input.value);

function update() {
    if (!$input.value) {
        return;
    }

    input.update($input.value.value);
}
</script>
