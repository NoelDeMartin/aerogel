<template>
    <component :is="component.tag" v-bind="component.props">
        <slot />
    </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { objectWithoutEmpty } from '@noeldemartin/utils';

import { booleanProp, objectProp, stringProp } from '@/utils/vue';

const { href, url, route, routeParams, routeQuery, submit } = defineProps({
    href: stringProp(),
    url: stringProp(),
    route: stringProp(),
    routeParams: objectProp(() => ({})),
    routeQuery: objectProp(() => ({})),
    submit: booleanProp(),
});

const component = computed(() => {
    if (route) {
        return {
            tag: 'router-link',
            props: {
                to: objectWithoutEmpty({
                    name: route,
                    params: routeParams,
                    query: routeQuery,
                }),
            },
        };
    }

    if (href || url) {
        return {
            tag: 'a',
            props: {
                target: '_blank',
                href: href || url,
            },
        };
    }

    return {
        tag: 'button',
        props: { type: submit ? 'submit' : 'button' },
    };
});
</script>
