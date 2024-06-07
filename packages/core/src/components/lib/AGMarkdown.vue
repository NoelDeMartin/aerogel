<template>
    <root />
</template>

<script setup lang="ts">
import { computed, h, useAttrs } from 'vue';

import { renderMarkdown } from '@/utils/markdown';
import { booleanProp, objectProp, stringProp } from '@/utils/vue';
import { translate } from '@/lang';

const props = defineProps({
    as: stringProp(),
    inline: booleanProp(),
    langKey: stringProp(),
    langParams: objectProp<Record<string, unknown>>(),
    text: stringProp(),
});

const attrs = useAttrs();
const markdown = computed(() => props.text ?? (props.langKey && translate(props.langKey, props.langParams ?? {})));
const html = computed(() => {
    if (!markdown.value) {
        return null;
    }

    let renderedHtml = renderMarkdown(markdown.value);

    if (props.inline) {
        renderedHtml = renderedHtml.replace('<p>', '<span>').replace('</p>', '</span>');
    }

    return renderedHtml;
});
const root = () =>
    h(props.as ?? (props.inline ? 'span' : 'div'), {
        innerHTML: html.value,
        ...attrs,
        class: `${attrs.class ?? ''} ${props.inline ? '' : 'prose'}`,
    });
</script>
