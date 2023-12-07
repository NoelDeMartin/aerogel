import { requiredStringProp, stringProp } from '@/utils';

export const confirmModalProps = {
    title: stringProp(),
    message: requiredStringProp(),
};

export function useConfirmModalProps(): typeof confirmModalProps {
    return confirmModalProps;
}
