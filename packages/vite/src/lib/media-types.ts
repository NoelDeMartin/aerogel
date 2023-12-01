// https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Image_types#common_image_file_types
const mediaTypeByExtension: Record<string, string> = {
    apng: 'image/apng',
    avif: 'image/avif',
    bmp: 'image/bmp',
    cur: 'image/x-icon',
    gif: 'image/gif',
    ico: 'image/x-icon',
    jfif: 'image/jpeg',
    jpeg: 'image/jpeg',
    jpg: 'image/jpeg',
    pjp: 'image/jpeg',
    pjpeg: 'image/jpeg',
    png: 'image/png',
    svg: 'image/svg',
    tif: 'image/tiff',
    tiff: 'image/tiff',
    webp: 'image/webp',
};

export function guessMediaType(filename: string): string | null {
    const extension = filename.match(/\.([^.]+)$/)?.[1];

    return (extension && mediaTypeByExtension[extension]) ?? null;
}
