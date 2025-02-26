import { computed } from 'vue';
import type { ExtractPropTypes } from 'vue';
import type { ObjectWithout } from '@noeldemartin/utils';

import { stringProp } from '@/utils';
import { translateWithDefault } from '@/lang';
import type { AcceptRefs } from '@/utils';

export const loadingModalProps = {
    message: stringProp(),
};

export type AGLoadingModalProps = AcceptRefs<
    ObjectWithout<ExtractPropTypes<typeof loadingModalProps>, null | undefined>
>;

export function useLoadingModalProps(): typeof loadingModalProps {
    return loadingModalProps;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function useLoadingModal(props: ExtractPropTypes<typeof loadingModalProps>) {
    const renderedMessage = computed(() => props.message ?? translateWithDefault('ui.loading', 'Loading...'));

    return { renderedMessage };
}
