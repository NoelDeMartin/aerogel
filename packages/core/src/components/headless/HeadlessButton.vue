<template>
    <Primitive
        :class="classes"
        :as-child="asChild"
        :disabled="disabled"
        v-bind="props"
    >
        <slot />
    </Primitive>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Primitive } from 'reka-ui';
import { objectWithoutEmpty } from '@noeldemartin/utils';

import type { ButtonProps } from '@aerogel/core/components/contracts/Button';

const { as, href, route, routeParams, routeQuery, submit, disabled, class: classes } = defineProps<ButtonProps>();

const props = computed(() => {
    if (as) {
        return { as };
    }

    if (route) {
        return {
            as: 'router-link',
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
</script>
