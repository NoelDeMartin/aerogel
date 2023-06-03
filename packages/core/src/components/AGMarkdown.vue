<template>
    <root />
</template>

<script setup lang="ts">
import { computed, h } from 'vue';

import { renderMarkdown } from '@/utils/markdown';
import { stringProp } from '@/utils/vue';
import { lang } from '@/lang/helpers';

const { langKey, text } = defineProps({
    langKey: stringProp(),
    text: stringProp(),
});
const markdown = computed(() => text ?? (langKey && lang(langKey)));
const html = computed(() => markdown.value && renderMarkdown(markdown.value));
const root = () => h('div', { class: 'prose', innerHTML: html.value });
</script>
