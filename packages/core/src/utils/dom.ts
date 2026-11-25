export async function copyToClipboard(text: string): Promise<boolean> {
    if (navigator.clipboard?.writeText) {
        try {
            await navigator.clipboard.writeText(text);

            return true;
        } catch {
            // Fall back to execCommand when Clipboard API fails
        }
    }

    const textarea = document.createElement('textarea');

    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();

    try {
        return document.execCommand('copy');
    } catch {
        return false;
    } finally {
        document.body.removeChild(textarea);
    }
}

export function isHovered(...elements: Array<Element | null | undefined>): boolean {
    const hoveredElements = Array.from(document.querySelectorAll(':hover'));

    return hoveredElements.some((hoveredElement) => elements.some((element) => element?.contains(hoveredElement)));
}
