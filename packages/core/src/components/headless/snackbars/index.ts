import { arrayProp, requiredStringProp } from '@/utils/vue';

export { default as AGHeadlessSnackbar } from './AGHeadlessSnackbar.vue';

export interface AGSnackbarAction {
    text: string;
    dismiss?: boolean;
    handler?(): unknown;
}

export const snackbarProps = {
    id: requiredStringProp(),
    message: requiredStringProp(),
    actions: arrayProp<AGSnackbarAction>(() => []),
};

export function useSnackbarProps(): typeof snackbarProps {
    return snackbarProps;
}
