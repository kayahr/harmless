/*
 * Copyright (C) 2024 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information.
 */

import { JSXElement } from "./JSXElement.js";
import { connectElement } from "./JSXNode.js";
import { RangeFragment } from "./RangeFragment.js";
import type { Element } from "./utils/types.js";

/**
 * JSX element for rendering a fragment.
 */
export class FragmentElement extends JSXElement<RangeFragment> {
    /** The fragment children. */
    readonly #children: Element[];

    /**
     * Creates a new fragment element.
     *
     * @param children - The fragment children
     */
    public constructor(children: Element) {
        super();
        this.#children = children instanceof Array ? children : [ children ];
    }

    /** @inheritDoc */
    protected doRender(): RangeFragment {
        return connectElement(this.runInContext(() => new RangeFragment(this.#children.map(child => this.resolveNode(child)))), this);
    }
}

/**
 * Creates a new fragment element with the given children
 *
 * @param children - The fragment children (or a single child).
 * @returns The created fragment element.
 */
export function Fragment({ children }: { children: Element }): FragmentElement {
    return new FragmentElement(children);
}
