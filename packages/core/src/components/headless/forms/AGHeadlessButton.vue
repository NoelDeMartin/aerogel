<template>
    <component :is="component.tag" v-bind="component.props">
        <slot />
    </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { objectWithoutEmpty } from '@noeldemartin/utils';
import type { LocationQuery, RouteLocation, RouteParams } from 'vue-router';

import { booleanProp, objectProp, stringProp } from '@/utils/vue';

const { url, route, routeParams, routeQuery, submit } = defineProps({
    url: stringProp(),
    route: stringProp(),
    routeParams: objectProp<RouteParams>(() => ({})),
    routeQuery: objectProp<LocationQuery>(() => ({})),
    submit: booleanProp(),
});

const component = computed(() => {
    if (route) {
        return {
            tag: 'router-link',
            props: {
                to: objectWithoutEmpty<Partial<RouteLocation>>({
                    name: route,
                    params: routeParams,
                    query: routeQuery,
                }),
            },
        };
    }

    if (url) {
        return {
            tag: 'a',
            props: {
                target: '_blank',
                href: url,
            },
        };
    }

    return {
        tag: 'button',
        props: { type: submit ? 'submit' : 'button' },
    };
});
</script>
