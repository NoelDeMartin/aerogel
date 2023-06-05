<template>
    <DialogTitle :as="as">
        <slot />
    </DialogTitle>
</template>

<script setup lang="ts">
import { DialogTitle } from '@headlessui/vue';

import { stringProp } from '@/utils/vue';

defineProps({ as: stringProp('h2') });
</script>
