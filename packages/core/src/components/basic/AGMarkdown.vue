<template>
    <root />
</template>

<script setup lang="ts">
import { computed, h } from 'vue';

import { renderMarkdown } from '@/utils/markdown';
import { booleanProp, stringProp } from '@/utils/vue';
import { translate } from '@/lang';

const props = defineProps({
    as: stringProp('div'),
    heading: booleanProp(),
    inline: booleanProp(),
    langKey: stringProp(),
    raw: booleanProp(),
    text: stringProp(),
});

const markdown = computed(() => props.text ?? (props.langKey && translate(props.langKey)));
const html = computed(() => {
    if (!markdown.value) {
        return null;
    }

    let renderedHtml = renderMarkdown(markdown.value);

    if (props.heading) {
        renderedHtml = renderedHtml.replace('<p>', '<span>').replace('</p>', '</span>');
    }

    if (props.inline) {
        renderedHtml = renderedHtml.replace('<p>', '<span>').replace('</p>', '</span>');
    }

    return renderedHtml;
});
const root = () => h(props.as, { class: props.raw ? '' : 'prose', innerHTML: html.value });
</script>
