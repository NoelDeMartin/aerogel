import { objectOnly } from '@noeldemartin/utils';

export type Replace<
    TOriginal extends Record<string, unknown>,
    TReplacements extends Partial<Record<keyof TOriginal, unknown>>,
> = {
    [K in keyof TOriginal]: TReplacements extends Record<K, infer Replacement> ? Replacement : TOriginal[K];
};

export function replaceExisting<
    TOriginal extends Record<string, unknown>,
    TReplacements extends Partial<Record<keyof TOriginal, unknown>>,
>(original: TOriginal, replacements: TReplacements): Replace<TOriginal, TReplacements> {
    return {
        ...original,
        ...objectOnly(replacements, Object.keys(original)),
    } as Replace<TOriginal, TReplacements>;
}
