import { computed } from 'vue';
import type { ExtractPropTypes } from 'vue';
import type { ObjectWithoutEmpty } from '@noeldemartin/utils';

import { stringProp } from '@/utils';
import { translateWithDefault } from '@/lang';

export const loadingModalProps = {
    message: stringProp(),
};

export type AGLoadingModalProps = ObjectWithoutEmpty<ExtractPropTypes<typeof loadingModalProps>>;

export function useLoadingModalProps(): typeof loadingModalProps {
    return loadingModalProps;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function useLoadingModal(props: ExtractPropTypes<typeof loadingModalProps>) {
    const renderedMessage = computed(() => props.message ?? translateWithDefault('ui.loading', 'Loading...'));

    return { renderedMessage };
}
