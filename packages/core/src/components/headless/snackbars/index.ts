import type { ExtractPropTypes } from 'vue';
import type { ObjectWithoutEmpty } from '@noeldemartin/utils';

import UI from '@aerogel/core/ui/UI';
import { arrayProp, enumProp, requiredStringProp } from '@aerogel/core/utils/vue';
import { Colors } from '@aerogel/core/components/constants';
import { objectWithout } from '@noeldemartin/utils';

export { default as AGHeadlessSnackbar } from './AGHeadlessSnackbar.vue';

export const SnackbarColors = objectWithout(Colors, ['Primary', 'Clear']);
export const snackbarProps = {
    id: requiredStringProp(),
    message: requiredStringProp(),
    actions: arrayProp<SnackbarAction>(() => []),
    color: enumProp(SnackbarColors, Colors.Secondary),
};

export interface SnackbarAction {
    text: string;
    dismiss?: boolean;
    handler?(): unknown;
}

export type SnackbarColor = (typeof SnackbarColors)[keyof typeof SnackbarColors];
export type AGSnackbarProps = ObjectWithoutEmpty<ExtractPropTypes<typeof snackbarProps>>;

export function useSnackbarProps(): typeof snackbarProps {
    return snackbarProps;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function useSnackbar(props: ExtractPropTypes<typeof snackbarProps>) {
    function activate(action: SnackbarAction): void {
        action.handler?.();
        action.dismiss && UI.hideSnackbar(props.id);
    }

    return { activate };
}
