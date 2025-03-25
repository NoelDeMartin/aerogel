<template>
    <root />
</template>

<script setup lang="ts">
import { computed, h, useAttrs } from 'vue';
import { isInstanceOf } from '@noeldemartin/utils';

import { renderMarkdown } from '@aerogel/core/utils/markdown';
import { booleanProp, mixedProp, objectProp, stringProp } from '@aerogel/core/utils/vue';
import { translate } from '@aerogel/core/lang';

const props = defineProps({
    as: stringProp(),
    inline: booleanProp(),
    langKey: stringProp(),
    langParams: mixedProp<number | Record<string, unknown>>(),
    text: stringProp(),
    actions: objectProp<Record<string, () => unknown>>(),
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
        onClick,
        ...attrs,
        class: `${attrs.class ?? ''} ${props.inline ? '' : 'prose'}`,
    });

async function onClick(event: Event) {
    const { target } = event;

    if (isInstanceOf(target, HTMLElement) && target.dataset.markdownAction) {
        props.actions?.[target.dataset.markdownAction]?.();

        return;
    }
}
</script>
