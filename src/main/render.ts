/*
 * Copyright (C) 2026 Klaus Reimer
 * SPDX-License-Identifier: MIT
 */

import type { JSX } from "./jsx.ts";
import { collectError, throwErrors } from "./errors.ts";
import { materialize, withNamespace } from "./runtime.ts";
import { ScopedRendered } from "./rendered/ScopedRendered.ts";

/** DOM node carrying a standard disposer. */
export type RenderedNode = Node & Disposable;

/**
 * Attaches a standard disposer to the given node.
 *
 * If the node already provides a disposer then it is chained after the new cleanup.
 *
 * @param node    - The node to decorate.
 * @param cleanup - The cleanup to attach.
 * @returns The same node with a standard disposer attached.
 */
function attachCleanup<T extends Node>(node: T, cleanup: () => void): T & RenderedNode {
    const disposableNode = node as T & Partial<RenderedNode>;
    const previousDispose = disposableNode[Symbol.dispose];
    let disposed = false;
    disposableNode[Symbol.dispose] = () => {
        if (disposed) {
            return;
        }
        disposed = true;
        const errors: unknown[] = [];
        collectError(errors, cleanup);
        collectError(errors, () => previousDispose?.call(node));
        throwErrors(errors);
    };
    return disposableNode as T & RenderedNode;
}

/**
 * Renders the given child into a DOM node.
 *
 * The returned node owns the reactive resources created while materializing the child. Insert or replace it anywhere you want using plain DOM operations.
 * When you no longer need the rendered subtree, dispose it through the standard disposable interface, for example with
 * `node[Symbol.dispose]()`, `dispose(node)` from `@kayahr/scope`, or `using`.
 *
 * Outputs resolving to multiple root nodes are returned as a detached {@link !DocumentFragment}.
 *
 * @param child - The child tree to materialize.
 * @returns The rendered root node.
 */
export function render(child: JSX.Element): RenderedNode {
    const rendered = new ScopedRendered(() => withNamespace(null, () => materialize(child)));
    const singleNode = rendered.getSingleNode();
    if (singleNode != null) {
        return attachCleanup(singleNode, () => {
            rendered.dispose();
        });
    }
    const fragment = document.createDocumentFragment();
    rendered.insert(fragment, null);
    return attachCleanup(fragment, () => {
        rendered.dispose();
    });
}
