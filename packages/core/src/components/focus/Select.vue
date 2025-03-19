<template>
    <Listbox :model-value="modelValue" @update:model-value="update($event)">
        <ListboxLabel v-if="label" class="sr-only">
            {{ label }}
        </ListboxLabel>
        <slot>
            <SelectTrigger
                class="grid w-full cursor-default grid-cols-1 rounded-md bg-white py-1.5 pl-3 pr-2 text-left text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-[--primary-600] sm:text-sm/6"
            >
                <span class="col-start-1 row-start-1 truncate pr-6">{{ previewText }}</span>
                <IconCheveronDown
                    class="size-5 sm:size-4 col-start-1 row-start-1 self-center justify-self-end text-gray-500"
                />
            </SelectTrigger>
            <SelectContent :class="optionsClass">
                <SelectItem v-for="(value, text) in options" :key="text" :value="value">
                    <span class="text-sm">
                        {{ text }}
                    </span>
                </SelectItem>
            </SelectContent>
        </slot>
    </Listbox>
</template>

<script setup lang="ts">
import IconCheveronDown from '~icons/zondicons/cheveron-down';

import { computed, inject, provide, ref } from 'vue';
import { Listbox, ListboxLabel } from '@headlessui/vue';
import { toString } from '@noeldemartin/utils';

import { objectProp, stringProp } from '@/utils/vue';
import type Form from '@/forms/Form';
import type { __ISelect } from '@/components/contracts/Select';
import type { FormFieldValue } from '@/forms/Form';

import SelectContent from './SelectContent.vue';
import SelectItem from './SelectItem.vue';
import SelectTrigger from './SelectTrigger.vue';

const props = defineProps({
    name: stringProp(),
    label: stringProp(),
    options: objectProp<Record<string, unknown>>(),
    optionsClass: stringProp(),
});
const emit = defineEmits(['update:modelValue']);
const $button = ref<HTMLElement>();
const $menu = ref<HTMLElement>();
const form = inject<Form | null>('form', null);
const modelValue = computed(() => props.name && form?.getFieldValue(props.name));
const previewText = computed(() => {
    const selectedValue = modelValue.value;

    for (const [text, value] of Object.entries(props.options ?? {})) {
        if (value !== selectedValue) {
            continue;
        }

        return text;
    }

    return toString(modelValue.value);
});

function update(value: FormFieldValue) {
    if (form && props.name) {
        form.setFieldValue(props.name, value);

        return;
    }

    emit('update:modelValue', value);
}

const api: __ISelect = {
    $button,
    $menu,
    __setButtonElement: (element) => ($button.value = element),
    __setMenuElement: (element) => ($menu.value = element),
};

provide('select', api);
defineExpose(api);
</script>
