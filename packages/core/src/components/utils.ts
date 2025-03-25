export function extractComponentProps<T extends Record<string, unknown>>(
    values: Record<string, unknown>,
    definitions: Record<string, unknown>,
): T {
    return Object.keys(definitions).reduce(
        (extracted, prop) => {
            extracted[prop] = values[prop];

            return extracted;
        },
        {} as Record<string, unknown>,
    ) as T;
}
