<template>
    <component :is="rootComponent" v-bind="rootProps">
        <slot />
    </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { DialogTitle } from '@headlessui/vue';

import { injectReactiveOrFail, stringProp } from '@/utils/vue';
import type { IAGModalContext } from '@/components/modals/AGModalContext';

const props = defineProps({ as: stringProp('h2') });

const { modal } = injectReactiveOrFail<IAGModalContext>(
    'modal',
    'could not obtain modal reference from <AGHeadlessModalPanel>, ' +
        'did you render this component manually? Show it using $ui.openModal() instead',
);
const rootComponent = computed(() => (modal.properties.inline ? 'div' : DialogTitle));
const rootProps = computed(() => (modal.properties.inline ? {} : { as: props.as }));
</script>
