<template>
    <root />
</template>

<script setup lang="ts">
import { computed, h, useAttrs } from 'vue';
import { isInstanceOf } from '@noeldemartin/utils';
import type { VNode } from 'vue';

import { renderMarkdown } from '@aerogel/core/utils/markdown';
import { translate, translateWithDefault } from '@aerogel/core/lang';
import { renderVNode } from '@aerogel/core/utils/vue';

const { as, inline, langKey, langParams, langDefault, text, actions } = defineProps<{
    as?: string;
    inline?: boolean;
    langKey?: string;
    langParams?: number | Record<string, unknown>;
    langDefault?: string;
    text?: string;
    actions?: Record<string, () => unknown>;
}>();

const attrs = useAttrs();
const slots = defineSlots<{ default?(): VNode[] }>();
const markdown = computed(() => {
    if (slots.default) {
        return slots.default().map(renderVNode).join('');
    }

    return (
        text ??
        (langKey &&
            (langDefault
                ? translateWithDefault(langKey, langDefault, langParams ?? {})
                : translate(langKey, langParams ?? {})))
    );
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

<style scoped>
/* @apply .text-links .font-normal .no-underline .hover:underline; */
* :deep(a) {
    --tw-font-weight: var(--font-weight-normal);
    text-decoration-line: none;
    color: var(--color-links);
    font-weight: var(--font-weight-normal);
}

@media (hover: hover) {
    * :deep(a:hover) {
        text-decoration-line: underline;
    }
}
</style>
