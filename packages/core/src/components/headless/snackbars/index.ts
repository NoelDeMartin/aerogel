import { arrayProp, enumProp, requiredStringProp } from '@/utils/vue';
import { Colors } from '@/components/constants';
import { objectWithout } from '@noeldemartin/utils';

export { default as AGHeadlessSnackbar } from './AGHeadlessSnackbar.vue';

export interface SnackbarAction {
    text: string;
    dismiss?: boolean;
    handler?(): unknown;
}

export type SnackbarColor = (typeof SnackbarColors)[keyof typeof SnackbarColors];

export const SnackbarColors = objectWithout(Colors, ['Primary', 'Clear']);
export const snackbarProps = {
    id: requiredStringProp(),
    message: requiredStringProp(),
    actions: arrayProp<SnackbarAction>(() => []),
    color: enumProp(SnackbarColors, Colors.Secondary),
};

export function useSnackbarProps(): typeof snackbarProps {
    return snackbarProps;
}
