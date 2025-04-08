<template>
    <HeadlessSelect ref="$select" v-bind="$props" @update:model-value="$emit('update:modelValue', $event)">
        <HeadlessSelectLabel class="block text-sm leading-6 font-medium text-gray-900" />
        <slot>
            <HeadlessSelectTrigger
                class="focus:outline-primary grid w-full cursor-default grid-cols-1 rounded-md bg-white py-1.5 pr-2 pl-3 text-left text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 focus:outline focus:outline-2 focus:-outline-offset-2 sm:text-sm/6"
                :class="{ 'mt-1': label }"
            >
                <HeadlessSelectValue class="col-start-1 row-start-1 truncate pr-6" />
                <IconCheveronDown
                    class="col-start-1 row-start-1 size-5 self-center justify-self-end text-gray-500 sm:size-4"
                />
            </HeadlessSelectTrigger>
            <HeadlessSelectOptions
                class="z-50 overflow-auto rounded-lg bg-white text-base shadow-lg ring-1 ring-black/5 focus:outline-hidden"
            >
                <HeadlessSelectOption
                    v-for="option of $select?.options ?? []"
                    :key="option.key"
                    :value="option.value"
                    class="group p-1 outline-none"
                >
                    <div
                        class="relative flex max-w-[calc(100vw-2rem)] cursor-pointer items-center truncate rounded-md px-2 py-1 select-none *:truncate group-data-[highlighted]:bg-gray-100 group-data-[state=checked]:font-semibold group-data-[state=unchecked]:opacity-50"
                    >
                        <span class="text-sm">
                            {{ option.label }}
                        </span>
                    </div>
                </HeadlessSelectOption>
            </HeadlessSelectOptions>
        </slot>
    </HeadlessSelect>
</template>

<script setup lang="ts">
import IconCheveronDown from '~icons/zondicons/cheveron-down';

import { useTemplateRef } from 'vue';

import HeadlessSelect from '@aerogel/core/components/headless/HeadlessSelect.vue';
import HeadlessSelectLabel from '@aerogel/core/components/headless/HeadlessSelectLabel.vue';
import HeadlessSelectTrigger from '@aerogel/core/components/headless/HeadlessSelectTrigger.vue';
import HeadlessSelectOptions from '@aerogel/core/components/headless/HeadlessSelectOptions.vue';
import HeadlessSelectOption from '@aerogel/core/components/headless/HeadlessSelectOption.vue';
import HeadlessSelectValue from '@aerogel/core/components/headless/HeadlessSelectValue.vue';
import type { SelectProps } from '@aerogel/core/components/contracts/Select';

defineProps<SelectProps>();
defineEmits(['update:modelValue']);

const $select = useTemplateRef('$select');
</script>
