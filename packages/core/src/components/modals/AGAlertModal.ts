import type { ExtractPropTypes } from 'vue';
import type { ObjectWithoutEmpty } from '@noeldemartin/utils';

import { requiredStringProp, stringProp } from '@/utils';

export const alertModalProps = {
    title: stringProp(),
    message: requiredStringProp(),
};

export type AGAlertModalProps = ObjectWithoutEmpty<ExtractPropTypes<typeof alertModalProps>>;

export function useAlertModalProps(): typeof alertModalProps {
    return alertModalProps;
}
