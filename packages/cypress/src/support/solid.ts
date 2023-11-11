export function cssPodUrl(path: string = ''): string {
    return cssUrl(`/alice${path}`);
}

export function cssUrl(path: string = ''): string {
    return `http://localhost:4000${path}`;
}

export function cssPodWebId(): string {
    return cssPodUrl('/profile/card#me');
}
