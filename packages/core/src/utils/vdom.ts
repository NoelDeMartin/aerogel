import { Comment, Static, Text } from 'vue';
import { toString } from '@noeldemartin/utils';
import type { VNode } from 'vue';

function renderAttrs(node: VNode): string {
    return Object.entries(node.props ?? {}).reduce((attrs, [name, value]) => {
        return attrs + `${name}="${toString(value)}"`;
    }, '');
}

export function renderNode(node: VNode | string): string {
    if (typeof node === 'string') {
        return node;
    }

    if (node.type === Comment) {
        return '';
    }

    if (node.type === Text || node.type === Static) {
        return node.children as string;
    }

    if (node.type === 'br') {
        return '\n\n';
    }

    return `<${node.type} ${renderAttrs(node)}>${Array.from(node.children as Array<VNode | string>)
        .map(renderNode)
        .join('')}</${node.type}>`;
}
