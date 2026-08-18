/*
 * Copyright (C) 2026 Klaus Reimer
 * SPDX-License-Identifier: MIT
 */

import { RenderedBase } from "./RenderedBase.ts";

/** Rendered output representing one concrete DOM node. */
export class NodeRendered<T extends ChildNode> extends RenderedBase {
    readonly #node: T;

    /**
     * Creates a rendered output wrapping one concrete DOM node.
     *
     * @param node    - The wrapped DOM node.
     * @param cleanup - Optional cleanup owned by this node.
     */
    public constructor(node: T, cleanup?: (() => void) | null) {
        super();
        this.#node = node;
        if (cleanup != null) {
            this.addDisposeCallback(cleanup);
        }
        this.addDestroyCallback(() => {
            this.#node.parentNode?.removeChild(this.#node);
        });
    }

    /** @inheritdoc */
    protected override onInsert(parent: Node & ParentNode, before: ChildNode | null): void {
        if (before == null) {
            parent.appendChild(this.#node);
        } else {
            before.before(this.#node);
        }
    }

    /** @inheritdoc */
    public override getFirstNode(): ChildNode | null {
        return this.#node;
    }

    /** @inheritdoc */
    public override getLastNode(): ChildNode | null {
        return this.#node;
    }

    /** @inheritdoc */
    public override getSingleNode(): ChildNode | null {
        return this.#node;
    }
}
