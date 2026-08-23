<template>
    <Primitive
        v-bind="props"
        ref="$rootRef"
        :class="classes"
        :as-child
        :disabled
    >
        <slot />
    </Primitive>
</template>

<script setup lang="ts">
import { computed, useTemplateRef } from 'vue';
import { Primitive } from 'reka-ui';
import { objectWithoutEmpty } from '@noeldemartin/utils';

import UI from '@aerogel/core/ui/UI';
import { exposeElementMethods } from '@aerogel/core/components/contracts/helpers';
import type { ButtonProps } from '@aerogel/core/components/contracts/Button';

const $root = useTemplateRef('$rootRef');
const { as, href, route, routeParams, routeQuery, submit, disabled, class: classes } = defineProps<ButtonProps>();
const props = computed(() => {
    if (as) {
        return { as };
    }

    if (route) {
        return {
            as: UI.resolveComponent('router-link') ?? 'a',
            to: objectWithoutEmpty({
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
