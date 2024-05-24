<template>
    <input
        :id="input.id"
        ref="$input"
        :name="name"
        :type="type"
        :value="value"
        :aria-invalid="input.errors ? 'true' : 'false'"
        :aria-describedby="
            input.errors ? `${input.id}-error` : input.description ? `${input.id}-description` : undefined
        "
        :checked="checked"
        @input="update"
    >
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

import { injectReactiveOrFail, stringProp } from '@/utils';
import type { IAGHeadlessInput } from '@/components/headless/forms/AGHeadlessInput';

const props = defineProps({
    type: stringProp('text'),
});

const $input = ref<HTMLInputElement>();
const input = injectReactiveOrFail<IAGHeadlessInput>(
    'input',
    '<AGHeadlessInputInput> must be a child of a <AGHeadlessInput>',
);
const name = computed(() => input.name ?? undefined);
const value = computed(() => input.value);
const checked = computed(() => {
    if (props.type !== 'checkbox') {
        return;
    }

    return !!value.value;
});

function update() {
    if (!$input.value) {
        return;
    }

    input.update(props.type === 'checkbox' ? $input.value.checked : $input.value.value);
}
</script>
