export function removeInteractiveClasses(classes: string): string {
    return classes
        .split(/\s+/)
        .filter((className) => !/^(hover|focus|focus-visible):/.test(className))
        .join(' ')
        .trim();
}
