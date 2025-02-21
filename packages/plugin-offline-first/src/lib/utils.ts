export function mapFromArray<K, V>(items: [K, V][]): Map<K, V> {
    const itemsMap = new Map();

    for (const [key, value] of items) {
        itemsMap.set(key, value);
    }

    return itemsMap;
}

export function lazy<T>(getter: () => Promise<T>): () => Promise<T> {
    const result: { value?: T } = {};

    return async () => {
        if (!('value' in result)) {
            result.value = await getter();
        }

        return result.value as T;
    };
}
