import type { ExtractPropTypes } from 'vue';
import type { ObjectWithout, Pretty } from '@noeldemartin/utils';

import { requiredStringProp, stringProp } from '@aerogel/core/utils';
import type { AcceptRefs } from '@aerogel/core/utils';

export const alertModalProps = {
    title: stringProp(),
    message: requiredStringProp(),
};

export type AGAlertModalProps = Pretty<
    AcceptRefs<ObjectWithout<ExtractPropTypes<typeof alertModalProps>, null | undefined>>
>;

export function useAlertModalProps(): typeof alertModalProps {
    return alertModalProps;
}
