/*
 * Copyright (C) 2024 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information.
 */

import { JSXDocumentFragment } from "./JSXDocumentFragment.js";
import { JSXElement } from "./JSXElement.js";
import { connectElement } from "./JSXNode.js";

/**
 * JSX element for rendering a fragment.
 */
export class FragmentElement extends JSXElement<JSXDocumentFragment> {
    /** The fragment children. */
    readonly #children: unknown;

    /**
     * Creates a new fragment element.
     *
     * @param children - The fragment children
     */
    public constructor(children: unknown) {
        super();
        this.#children = children;
    }

    /** @inheritDoc */
    protected doRender(): JSXDocumentFragment {
        const children = this.#children;
        const node = connectElement(new JSXDocumentFragment(), this);
        return this.runInScope(() => {
            if (children instanceof Array) {
                for (const child of children) {
                    node.appendChild(this.resolveNode(child));
                }
            } else {
                node.appendChild(this.resolveNode(children));
            }
            return node;
        });
    }
}

/**
 * Creates a new fragment element with the given children
 *
 * @param children - The fragment children (or a single child).
 * @returns The created fragment element.
 */
export function Fragment({ children }: { children: unknown }): FragmentElement {
    return new FragmentElement(children);
}
