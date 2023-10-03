export interface FormatCodeBlockOptions {
    indent?: number;
}

export function formatCodeBlock(code: string, options: FormatCodeBlockOptions = {}): string {
    const lines = code.split('\n');
    const indent = options.indent ?? 0;
    let originalIndent = 0;
    let formatted = '';

    for (const line of lines) {
        const trimmedLine = line.trim();
        const isEmptyLine = trimmedLine.length === 0;

        if (formatted.length === 0) {
            if (isEmptyLine) {
                continue;
            }

            originalIndent = line.indexOf(trimmedLine[0] ?? '');
            formatted += `${' '.repeat(indent)}${trimmedLine}\n`;

            continue;
        }

        if (isEmptyLine) {
            formatted += '\n';

            continue;
        }

        const lineIndent = line.indexOf(trimmedLine[0] ?? '');

        formatted += `${' '.repeat(indent + lineIndent - originalIndent)}${trimmedLine}\n`;
    }

    return formatted.trimEnd();
}
