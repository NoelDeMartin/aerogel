export interface AerogelModule {}

export function defineModule<T extends AerogelModule>(module: T): T {
    return module;
}
