import { stringProp } from '@/utils';

export const loadingModalProps = {
    message: stringProp(),
};

export function useLoadingModalProps(): typeof loadingModalProps {
    return loadingModalProps;
}
