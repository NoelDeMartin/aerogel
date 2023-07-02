<template>
    <root />
</template>

<script setup lang="ts">
import { computed, h } from 'vue';

import { renderMarkdown } from '@/utils/markdown';
import { stringProp } from '@/utils/vue';
import { translate } from '@/utils/lang';

const props = defineProps({
    langKey: stringProp(),
    text: stringProp(),
});

const markdown = computed(() => props.text ?? (props.langKey && translate(props.langKey)));
const html = computed(() => markdown.value && renderMarkdown(markdown.value));
const root = () => h('div', { class: 'prose', innerHTML: html.value });
</script>
