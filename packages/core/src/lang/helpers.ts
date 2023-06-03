import { useI18n } from 'vue-i18n';

export function lang(key: string): string {
    const { t } = useI18n();

    return t(key);
}
