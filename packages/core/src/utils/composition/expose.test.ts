import { describe, expect, it } from 'vitest';
import { createApp, defineComponent, h, nextTick, ref } from 'vue';

import { useForwardExpose } from './expose';

const Leaf = defineComponent({
    setup(_, { expose }) {
        expose({ leafMethod: () => 'leaf' });

        return () => h('div');
    },
});

const Middle = defineComponent({
    props: { label: String },
    setup() {
        const { forwardRef } = useForwardExpose();

        return () => h(Leaf, { ref: forwardRef });
    },
});

const Outer = defineComponent({
    props: { label: String },
    setup(props) {
        const { forwardRef } = useForwardExpose();

        return () => h(Middle, { ref: forwardRef, label: props.label });
    },
});

describe('Vue expose helpers', () => {

    it('forwards exposed API', async () => {
        // Arrange
        const label = ref('foo');
        const $middle = ref();
        const $outer = ref();

        // Act
        createApp({
            render: () => [
                h(Middle, { ref: $middle, label: label.value }),
                h(Outer, { ref: $outer, label: label.value }),
            ],
        }).mount(document.createElement('div'));

        label.value = 'bar';

        await nextTick();

        // Assert
        expect($middle.value.leafMethod()).toBe('leaf');
        expect($middle.value.label).toBe('bar');
        expect($outer.value.leafMethod()).toBe('leaf');
        expect($outer.value.label).toBe('bar');
    });

});
