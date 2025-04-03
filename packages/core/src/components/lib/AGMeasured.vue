<template>
    <component :is="as" v-measure="() => (measured = true)" :class="{ 'invisible! absolute! w-auto!': !measured }">
        <slot />
    </component>
</template>

<script setup lang="ts">
import { ref } from 'vue';

import { stringProp } from '@aerogel/core/utils/vue';

defineProps({ as: stringProp('span') });

// TODO use v-measure.css
const measured = ref(false);
</script>
