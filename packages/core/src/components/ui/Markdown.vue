<template>
    <root />
</template>

<script setup lang="ts">
import { computed, h, useAttrs } from 'vue';
import { isInstanceOf } from '@noeldemartin/utils';
import type { VNode } from 'vue';

import { renderMarkdown } from '@aerogel/core/utils/markdown';
import { translate } from '@aerogel/core/lang';
import { renderNode } from '@aerogel/core/utils/vdom';

const { as, inline, langKey, langParams, text, actions } = defineProps<{
    as?: string;
    inline?: boolean;
    langKey?: string;
    langParams?: number | Record<string, unknown>;
    text?: string;
    actions?: Record<string, () => unknown>;
}>();

const attrs = useAttrs();
const slots = defineSlots<{ default?(): VNode[] }>();
const markdown = computed(() => {
    if (slots.default) {
        return slots.default().map(renderNode).join('');
    }

    return text ?? (langKey && translate(langKey, langParams ?? {}));
});
const html = computed(() => {
    if (!markdown.value) {
        return null;
    }

    let renderedHtml = renderMarkdown(markdown.value);

    if (inline) {
        renderedHtml = renderedHtml.replace('<p>', '<span>').replace('</p>', '</span>');
    }

    return renderedHtml;
});
const root = () =>
    h(as ?? (inline ? 'span' : 'div'), {
        innerHTML: html.value,
        onClick,
        ...attrs,
        class: `${attrs.class ?? ''} ${inline ? '' : 'prose'}`,
    });

async function onClick(event: Event) {
    const { target } = event;

    if (isInstanceOf(target, HTMLElement) && target.dataset.markdownAction) {
        actions?.[target.dataset.markdownAction]?.();

        return;
    }
}
</script>
