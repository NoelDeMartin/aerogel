<template>
    <HeadlessSelectOptions
        class="z-50 overflow-auto rounded-lg bg-white text-base shadow-lg ring-1 ring-black/5 focus:outline-hidden"
    >
        <slot>
            <HeadlessSelectOption
                v-for="option of select?.options ?? []"
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
        </slot>
    </HeadlessSelectOptions>
</template>

<script setup lang="ts">
import HeadlessSelectOption from '@aerogel/core/components/headless/HeadlessSelectOption.vue';
import HeadlessSelectOptions from '@aerogel/core/components/headless/HeadlessSelectOptions.vue';
import { injectReactiveOrFail } from '@aerogel/core/utils';
import type { SelectExpose } from '@aerogel/core/components/contracts/Select';

const select = injectReactiveOrFail<SelectExpose>('select', '<SelectOptions> must be a child of a <Select>');
</script>
