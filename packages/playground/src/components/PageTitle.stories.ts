import type { Meta } from '@storybook/vue3';

import PageTitle from './PageTitle.vue';

interface Args {
    title: string;
    // viewSource: boolean;
}

// TODO reactivity not working :/
// TODO can't use helper because of static analysis
// https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
    component: PageTitle,
    title: 'PageTitle',
    args: {
        title: 'My Awesome Page',
    },
    render: ({ title }) => ({
        components: { PageTitle },
        setup() {
            return { title };
        },
        template: '<PageTitle >{{ title }}</PageTitle>',
    }),
} as Meta<Args>;

export const Primary = {};
