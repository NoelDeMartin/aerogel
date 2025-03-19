<template>
    <Teleport to="body">
        <ListboxOptions as="template">
            <component
                :is="as"
                v-bind="$attrs"
                ref="$menu"
                class="z-50 overflow-auto rounded-lg bg-white text-base shadow-lg ring-1 ring-black/5 focus:outline-none"
            >
                <slot />
            </component>
        </ListboxOptions>
    </Teleport>
</template>

<script setup lang="ts">
import { createPopper } from '@popperjs/core';
import { ListboxOptions } from '@headlessui/vue';
import { watchEffect } from 'vue';
import type { Placement } from '@popperjs/core';
import type { PropType } from 'vue';

import { elementRef } from '@/components/utils';
import { injectReactiveOrFail, mixedProp, stringProp } from '@/utils/vue';
import type { __ISelect } from '@/components/contracts/Select';

defineOptions({ inheritAttrs: false });
const props = defineProps({
    as: stringProp('ul'),
    placement: mixedProp<Placement>(String as PropType<Placement>, 'bottom-start'),
});
const $menu = elementRef();
const input = injectReactiveOrFail<__ISelect>('select', '<SelectContent> must be a child of a <Select>');

watchEffect(() => input.__setMenuElement($menu.value));
watchEffect((onCleanup) => {
    if (!input.$button || !input.$menu) {
        return;
    }

    const { destroy } = createPopper(input.$button, input.$menu, {
        placement: props.placement,
        strategy: 'fixed',
        modifiers: [{ name: 'offset', options: { offset: [0, 4] } }],
    });

    onCleanup(destroy);
});
</script>
