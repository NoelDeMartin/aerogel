<template>
    <component :is="component.as" ref="$root" v-bind="component.props">
        <slot />
    </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { objectWithoutEmpty } from '@noeldemartin/utils';

import { booleanProp, objectProp, stringProp } from '@aerogel/core/utils/vue';
import { elementRef } from '@aerogel/core/components/composition';

import type { IAGHeadlessButton } from './AGHeadlessButton';

const props = defineProps({
    as: objectProp(),
    href: stringProp(),
    url: stringProp(),
    route: stringProp(),
    routeParams: objectProp(() => ({})),
    routeQuery: objectProp(() => ({})),
    submit: booleanProp(),
});

const $root = elementRef();
const component = computed(() => {
    if (props.as) {
        return { as: props.as, props: {} };
    }

    if (props.route) {
        return {
            as: 'router-link',
            props: {
                to: objectWithoutEmpty({
                    name: props.route,
                    params: props.routeParams,
                    query: props.routeQuery,
                }),
            },
        };
    }

    if (props.href || props.url) {
        return {
            as: 'a',
            props: {
                target: '_blank',
                href: props.href || props.url,
            },
        };
    }

    return {
        as: 'button',
        props: { type: props.submit ? 'submit' : 'button' },
    };
});

defineExpose<IAGHeadlessButton>({ $el: $root });
</script>
