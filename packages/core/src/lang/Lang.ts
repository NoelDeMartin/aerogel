import { facade } from '@noeldemartin/utils';

import App from '@/services/App';
import Service from '@/services/Service';

export interface LangProvider {
    translate(key: string, parameters?: Record<string, unknown> | number): string;
    translateWithDefault(key: string, defaultMessage: string, parameters?: Record<string, unknown> | number): string;
}

export class LangService extends Service {

    private provider: LangProvider;

    constructor() {
        super();

        this.provider = {
            translate: (key) => {
                // eslint-disable-next-line no-console
                App.development && console.warn('Lang provider is missing');

                return key;
            },
            translateWithDefault: (_, defaultMessage) => {
                // eslint-disable-next-line no-console
                App.development && console.warn('Lang provider is missing');

                return defaultMessage;
            },
        };
    }

    public setProvider(provider: LangProvider): void {
        this.provider = provider;
    }

    public translate(key: string, parameters?: Record<string, unknown> | number): string {
        return this.provider.translate(key, parameters) ?? key;
    }

    public translateWithDefault(
        key: string,
        defaultMessage: string,
        parameters: Record<string, unknown> | number = {},
    ): string {
        return this.provider.translateWithDefault(key, defaultMessage, parameters);
    }

}

export default facade(LangService);
