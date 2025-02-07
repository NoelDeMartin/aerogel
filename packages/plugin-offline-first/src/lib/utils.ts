export function lazy<T>(getter: () => Promise<T>): () => Promise<T> {
    const result: { value?: T } = {};

    return async () => {
        if (!('value' in result)) {
            result.value = await getter();
        }

        return result.value as T;
    };
}
