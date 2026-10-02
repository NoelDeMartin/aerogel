<template>
    <Primitive v-bind="props" ref="$rootRef" :class="classes" :as-child :disabled>
        <slot />
    </Primitive>
</template>

<script setup lang="ts">
import type { ButtonProps } from '@aerogel/core/components/contracts/Button';
import { exposeElementMethods } from '@aerogel/core/components/contracts/helpers';
import UI from '@aerogel/core/ui/UI';
import { objectWithoutEmpty } from '@noeldemartin/utils';
import { Primitive } from 'reka-ui';
import { computed, useTemplateRef } from 'vue';

const $root = useTemplateRef('$rootRef');
const { as, href, to, route, routeParams, routeQuery, submit, disabled, class: classes } = defineProps<ButtonProps>();
const props = computed(() => {
    if (as) {
        return { as };
    }

    if (route || to) {
        return {
            as: UI.resolveComponent('router-link') ?? 'a',
            to:
                to ??
                objectWithoutEmpty({
                    name: route,
                    params: routeParams,
                    query: routeQuery,
                }),
        };
    }

    if (href) {
        return {
            as: 'a',
            target: '_blank',
            href,
        };
    }

    return {
        as: 'button',
        type: submit ? 'submit' : 'button',
    };
});

defineExpose(exposeElementMethods(() => $root.value?.$el));
</script>
