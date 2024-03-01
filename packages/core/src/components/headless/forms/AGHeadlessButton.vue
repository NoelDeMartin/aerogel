<template>
    <component :is="component.tag" v-bind="component.props">
        <slot />
    </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { objectWithoutEmpty } from '@noeldemartin/utils';

import { booleanProp, objectProp, stringProp } from '@/utils/vue';

const props = defineProps({
    href: stringProp(),
    url: stringProp(),
    route: stringProp(),
    routeParams: objectProp(() => ({})),
    routeQuery: objectProp(() => ({})),
    submit: booleanProp(),
});

const component = computed(() => {
    if (props.route) {
        return {
            tag: 'router-link',
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
            tag: 'a',
            props: {
                target: '_blank',
                href: props.href || props.url,
            },
        };
    }

    return {
        tag: 'button',
        props: { type: props.submit ? 'submit' : 'button' },
    };
});
</script>
