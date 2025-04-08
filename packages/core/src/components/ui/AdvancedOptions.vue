<template>
    <details class="group">
        <summary
            class="-ml-2 flex w-[max-content] cursor-pointer items-center rounded-lg py-2 pr-3 pl-1 hover:bg-gray-100 focus-visible:outline focus-visible:outline-gray-700"
        >
            <IconCheveronRight class="size-6 transition-transform group-open:rotate-90" />
            <span>{{ $td('ui.advancedOptions', 'Advanced options') }}</span>
        </summary>

        <div class="pt-2 pl-4">
            <slot />
        </div>
    </details>
</template>

<script setup lang="ts">
import IconCheveronRight from '~icons/zondicons/cheveron-right';
</script>
