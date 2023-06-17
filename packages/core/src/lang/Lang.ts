import { useI18n } from 'vue-i18n';
import { facade } from '@noeldemartin/utils';
import type { Composer } from 'vue-i18n';

import Service from '@/services/Service';

export class LangService extends Service {

    private i18n?: Composer;

    public setup(): void {
        this.i18n = useI18n();
    }

    public translate(key: string, parameters: Record<string, unknown> = {}): string {
        return this.i18n?.t(key, parameters) ?? key;
    }

}

export default facade(new LangService());
