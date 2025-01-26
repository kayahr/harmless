/*
 * Copyright (C) 2025 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information.
 */

import { destroyElement, getFragment, setFragment } from "./JSXNode.js";

/** Empty text node marking the start of a document fragment. */
export class JSXDocumentFragmentStart extends Text {}

/** Empty text node marking the end of a document fragment. */
export class JSXDocumentFragmentEnd extends Text {}

/**
 * A special document fragment implementation which retains the client/parent relationships. Only works when all DOM operations are performed with the
 * provided utility functions in `JSXNode.ts`.
 */
export class JSXDocumentFragment extends DocumentFragment {
    /** Anchor in the DOM marking the start of this fragment. */
    readonly #startAnchor = new JSXDocumentFragmentStart();

    /** Anchor in the DOM marking the end of this fragment. */
    readonly #endAnchor = new JSXDocumentFragmentEnd();

    /**
     * Creates a new document fragment.
     */
    public constructor() {
        super();
        super.appendChild(setFragment(this.#startAnchor, this));
        super.appendChild(setFragment(this.#endAnchor, this));
    }

    /**
     * @returns True if document fragment is anchored into the DOM, false if not.
     */
    public hasParentNode(): boolean {
        return this.#startAnchor.parentNode !== this;
    }

    /**
     * @returns The parent node.
     */
    public getParentNode(): Node | null {
        return this.#startAnchor.parentNode;
    }

    /**
     * @returns the parent fragment or null if the parent node is not a fragment.
     */
    public getParentFragment(): JSXDocumentFragment | null {
        let node = this.#startAnchor.previousSibling;
        while (node != null) {
            const fragment = getFragment(node);
            if (fragment != null) {
                if (node === fragment.#startAnchor) {
                    return fragment;
                } else if (node === fragment.#endAnchor) {
                    node = fragment.#startAnchor;
                }
            }
            node = node.previousSibling;
        }
        return null;
    }

    /**
     * Appends this document fragment to the given parent by moving all elements from fragments start anchor to end anchor to the new parent.
     *
     * @param param - The param node to append the fragment to.
     * @returns This fragment.
     */
    public appendTo(parent: Node): this {
        if (parent instanceof JSXDocumentFragment) {
            // When parent is a document fragment then we can directly forward to appendChild
            parent.appendChild(this);
        } else {
            // When parent is not a document fragment then we have to add each child separately
            for (const child of this.getChildNodes()) {
                parent.appendChild(child);
            }
        }
        return this;
    }

    #getInsertionParent(): Node {
        const parentNode = this.#endAnchor.parentNode;
        if (parentNode == null) {
            throw new DOMException("Fragment has no insertion parent", "NotFoundError");
        }
        return parentNode;
    }

    /**
     * Appends the given node as a child to this fragment. The new node is inserted before the end anchor of the fragment.
     *
     * @param node - The node to append.
     * @returns The appended node.
     */
    public override appendChild<T extends Node>(node: T): T {
        const parentNode = this.#getInsertionParent();
        if (node instanceof JSXDocumentFragment) {
            for (const child of node.getChildNodes()) {
                parentNode.insertBefore(child, this.#endAnchor);
            }
            return node;
        } else {
            setFragment(node, this);
            return parentNode.insertBefore(node, this.#endAnchor);
        }
    }

    /**
     * @returns Iterable children of this fragment.
     */
    public *getChildNodes(): Iterable<Node> {
        let node: Node | null = this.#startAnchor;
        while (node != null) {
            const nextSibling: Node | null = node.nextSibling;
            yield node;
            if (node === this.#endAnchor) {
                return;
            }
            node = nextSibling;
        }
        throw new DOMException("End anchor of fragment not found", "NotFoundError");
    }

    /**
     * Removes this fragment from the DOM by moving the already anchored elements into the fragment content. Does nothing if fragment is not anchored.
     */
    public remove(): void {
        if (this.hasParentNode()) {
            for (const node of this.getChildNodes()) {
                super.appendChild(node);
            }
        }
        destroyElement(this);
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
        if (this.hasParentNode()) {
            const parentFragment = this.getParentFragment();
            for (const oldNode of this.getChildNodes()) {
                if (oldNode === this.#endAnchor) {
                    const parentNode = this.#getInsertionParent();
                    setFragment(newNode, parentFragment);
                    parentNode.replaceChild(newNode, oldNode);
                }
                super.appendChild(oldNode);
            }
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
            if (node instanceof JSXDocumentFragmentStart) {
                const fragment = getFragment(node);
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
