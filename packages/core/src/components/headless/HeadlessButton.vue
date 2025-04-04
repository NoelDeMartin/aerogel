<template>
    <Primitive :class="classes" :as-child="asChild" v-bind="props">
        <slot />
    </Primitive>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Primitive } from 'reka-ui';
import { objectWithoutEmpty } from '@noeldemartin/utils';

import type { IButtonProps } from '@aerogel/core/components/contracts/Button';

const { as, href, route, routeParams, routeQuery, submit, class: classes } = defineProps<IButtonProps>();

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
