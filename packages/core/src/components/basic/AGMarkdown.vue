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
    langKey: stringProp(),
    text: stringProp(),
    inline: booleanProp(),
    raw: booleanProp(),
});

const markdown = computed(() => props.text ?? (props.langKey && translate(props.langKey)));
const html = computed(() => {
    if (!markdown.value) {
        return null;
    }

    let html = renderMarkdown(markdown.value);

    if (props.inline) {
        html = html.replace('<p>', '<span>').replace('</p>', '</span>');
    }

    return html;
});
const root = () => h(props.as, { class: props.raw ? '' : 'prose', innerHTML: html.value });
</script>
