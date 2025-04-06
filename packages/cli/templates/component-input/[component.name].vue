<template>
    <HeadlessInput v-bind="props">
        <HeadlessInputLabel />
        <HeadlessInputInput v-bind="attrs" />
        <HeadlessInputDescription />
        <HeadlessInputError />
    </HeadlessInput>
</template>

<script setup lang="ts">
import { useInputAttrs, useInputProps } from '@aerogel/core';

defineOptions({ inheritAttrs: false });

const props = defineProps(useInputProps());
const [attrs] = useInputAttrs();
</script>
