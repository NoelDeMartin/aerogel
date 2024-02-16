import { facade, toString } from '@noeldemartin/utils';

import App from '@/services/App';
import Service from '@/services/Service';

export interface LangProvider {
    translate(key: string, parameters?: Record<string, unknown>): string;
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
        };
    }

    public setProvider(provider: LangProvider): void {
        this.provider = provider;
    }

    public translate(key: string, parameters?: Record<string, unknown>): string {
        return this.provider.translate(key, parameters) ?? key;
    }

    public translateWithDefault(key: string, defaultMessage: string): string;
    public translateWithDefault(key: string, parameters: Record<string, unknown>, defaultMessage: string): string;
    public translateWithDefault(
        key: string,
        defaultMessageOrParameters?: string | Record<string, unknown>,
        defaultMessage?: string,
    ): string {
        defaultMessage ??= defaultMessageOrParameters as string;

        const parameters = typeof defaultMessageOrParameters === 'string' ? {} : defaultMessageOrParameters ?? {};
        const message = this.provider.translate(key, parameters) ?? key;

        if (message === key) {
            return Object.entries(parameters).reduce(
                (renderedMessage, [name, value]) =>
                    renderedMessage.replace(new RegExp(`\\{\\s*${name}\\s*\\}`, 'g'), toString(value)),
                defaultMessage,
            );
        }

        return message;
    }

}

export default facade(LangService);
