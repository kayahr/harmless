/*
 * Copyright (C) 2025 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information.
 */

import { destroyElement } from "./JSXNode.js";
import { PlaceholderNode } from "./PlaceholderNode.js";

/** Anchor node marking the start of a range fragment. */
export class RangeFragmentStart extends Comment {
    public constructor(public readonly ownerFragment: RangeFragment) {
        super("<>");
    }
}

/** Anchor node marking the end of a range fragment. */
export class RangeFragmentEnd extends Comment {
    public constructor(public readonly ownerFragment: RangeFragment) {
        super("</>");
    }
}

/**
 * A special document fragment implementation which keeps track of its elements by enclosing them with start and end anchor elements (which are technically
 * comment nodes).
 */
export class RangeFragment extends DocumentFragment {
    /** Anchor in the DOM marking the start of this fragment. */
    readonly #startAnchor = new RangeFragmentStart(this);

    /** Anchor in the DOM marking the end of this fragment. */
    readonly #endAnchor = new RangeFragmentEnd(this);

    /**
     * Creates a new document fragment.
     *
     * @param elements - Optional list of initial elements to append to the fragment.
     */
    public constructor(elements?: Node[]) {
        super();
        super.appendChild(this.#startAnchor);
        if (elements != null) {
            for (let i = 0, max = elements.length; i < max; i++) {
                super.appendChild(elements[i]);
            }
        }
        super.appendChild(this.#endAnchor);
    }

    /**
     * @returns True if document fragment is detached from the DOM, false if it is attached to a parent node.
     */
    #isDetached(): boolean {
        return this.#startAnchor.parentNode === this;
    }

    /**
     * @returns The real parent node. In detached mode this is the fragment itself, otherwise it is the real DOM parent (no fragment).
     */
    #getParentNode(): ParentNode {
        return this.#endAnchor.parentNode as ParentNode;
    }

    /**
     * Appends the given node as a child to this fragment. The new node is inserted before the end anchor of the fragment.
     *
     * @param node - The node to append.
     * @returns The appended node.
     */
    public override appendChild<T extends Node>(node: T): T {
        if (this.#isDetached()) {
            return super.insertBefore(node, this.#endAnchor);
        } else {
            if (node instanceof RangeFragment) {
                node.remove();
            }
            return this.#getParentNode().insertBefore(node, this.#endAnchor);
        }
    }

    /**
     * Removes this fragment from the DOM by moving the attached elements into the fragment content. Does nothing if fragment is detached.
     */
    public remove(): void {
        if (!this.#isDetached()) {
            const end = this.#endAnchor;
            let node: ChildNode | null = this.#startAnchor;
            while (node != null) {
                const next: ChildNode | null = node.nextSibling;
                if (super.appendChild(node) === end) {
                    break;
                }
                node = next;
            }
        }
    }

    /**
     * Replaces this fragment in the DOM with the given node. The previously anchored content of the fragment is moved back into the fragment.
     * Does nothing if fragment is not anchored in the DOM.
     *
     * @param newNode - The node to replace this fragment with.
     */
    public replaceWith(newNode: Node): void {
        if (newNode === this) {
            return;
        }
        if (!this.#isDetached()) {
            const placeholder = new PlaceholderNode();
            this.#getParentNode().insertBefore(placeholder, this.#startAnchor);
            this.remove();
            if (newNode instanceof RangeFragment) {
                newNode.remove();
            }
            placeholder.replaceWith(newNode);
        }
        destroyElement(this);
    }

    /**
     * Destroys the elements connected to the fragment child nodes.
     */
    public destroy(): void {
        let node: Node | null = this.#startAnchor.nextSibling;
        while (node != null && node != this.#endAnchor) {
            let next = node.nextSibling;
            if (node instanceof RangeFragmentStart) {
                const fragment = node.ownerFragment;
                if (fragment != null) {
                    next = fragment.#endAnchor.nextSibling;
                    destroyElement(fragment);
                }
            } else {
                destroyElement(node);
            }
            node = next;
        }
    }
}
