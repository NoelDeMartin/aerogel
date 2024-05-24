<template>
    <AGHeadlessInput v-bind="props">
        <AGHeadlessInputLabel />
        <AGHeadlessInputInput v-bind="attrs" />
        <AGHeadlessInputDescription />
        <AGHeadlessInputError />
    </AGHeadlessInput>
</template>

<script setup lang="ts">
import { useInputAttrs, useInputProps } from '@aerogel/core';

defineOptions({ inheritAttrs: false });

const props = defineProps(useInputProps());
const [attrs] = useInputAttrs();
</script>
