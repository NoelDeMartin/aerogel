import Lang from '@/services/Lang';

export function translate(key: string, parameters?: Record<string, unknown>): string {
    return Lang.translate(key, parameters);
}
