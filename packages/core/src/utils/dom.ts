export function isHovered(...elements: Array<Element | null | undefined>): boolean {
    const hoveredElements = Array.from(document.querySelectorAll(':hover'));

    return hoveredElements.some((hoveredElement) => elements.some((element) => element?.contains(hoveredElement)));
}
