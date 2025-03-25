import { arrayFrom } from '@noeldemartin/utils';
import type { Node, SyntaxKind } from 'ts-morph';

export function editFiles(): boolean {
    // TODO mock editor instead of relying on this for unit tests
    return true;
}

export function findDescendant<T extends Node>(
    node: Node | undefined,
    options: {
        guard?: (node: Node | undefined) => node is T;
        validate?: (node: T) => boolean;
        skip?: SyntaxKind | SyntaxKind[];
    } = {},
): T | undefined {
    if (!node) {
        return;
    }

    const guard = options.guard ?? (() => true);
    const validate = options.validate ?? (() => true);
    const skipKinds = arrayFrom(options.skip ?? []);

    return node.forEachDescendant((descendant, traversal) => {
        if (guard(descendant) && validate(descendant as T)) {
            return descendant as T;
        }

        const descendantKind = descendant.getKind();

        if (skipKinds.includes(descendantKind)) {
            traversal.skip();
        }
    });
}

export function when<T extends Node>(node: Node | undefined, assertion: (node: Node) => node is T): T | undefined {
    if (!node || !assertion(node)) {
        return;
    }

    return node as T;
}
