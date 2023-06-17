import Lang from '@/lang/Lang';

export function lang(key: string, parameters: Record<string, unknown> = {}): string {
    return Lang.translate(key, parameters);
}
