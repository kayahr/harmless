/*
 * Copyright (C) 2024 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information.
 */

import type { JSXElement } from "./JSXElement.ts";
import { PlaceholderNode } from "./PlaceholderNode.ts";

/** Function type for node replace listeners. */
export type ReplaceListener = (newNode: Node) => void;

/** Symbol used for connecting a JSX element to a DOM node. */
const jsxElement = Symbol();

/** Property symbol used for list of node replace listeners. */
const replaceListeners = Symbol();

/**
 * Extended Node interface with added properties to connect an optional JSX element and JSX document fragment.
 */
interface JSXNode extends Node {
    /** Optional JSX element connected to the node. Used to find the connected element to destroy it when node is removed from DOM. */
    [ jsxElement ]?: JSXElement;

    /** Optional list of registered replacement listeners. */
    [ replaceListeners ]?: ReplaceListener[];
}

/**
 * Connects the given JSX element to the given node. Must be called when a DOM node is created byt the JSX runtime for a JSX element to connect both so the
 * element can be destroyed when the DOM node is removed (see {@link destroyElement}).
 *
 * @param node    - The node to connect the JSX element to.
 * @param element - The JSX element to connect to the node.
 * @returns The DOM node.
 */
export function connectElement<T extends JSXNode>(node: T, element: JSXElement | null): T {
    if (element != null) {
        node[jsxElement] = element;
    } else {
        delete node[jsxElement];
    }
    return node;
}

/**
 * @returns the JSX element connected to the given node or null if none.
 */
export function getElement(node: JSXNode): JSXElement | null {
    return node[jsxElement] ?? null;
}

/**
 * Destroys the JSX element connected to the given DOM node (if any). Must be called when a DOM node, which was created by the JSX runtime, is removed from the
 * DOM. Also see {@link connectElement}.
 *
 * @param node - The node from which to read the JSX element to destroy.
 */
export function destroyElement(node: JSXNode): void {
    if (node instanceof RangeFragment) {
        node.destroy();
    }
    const element = getElement(node);
    if (element != null) {
        element.destroy();
        delete node[jsxElement];
    }
}

/**
 * Replaces the given node with a new node. This helper function delegates the call to a document fragment if needed or the parent of the old node. It
 * also informs registered listeners about the node replacement.
 *
 * @param oldNode - The node to replace.
 * @param newNode - The node to replace the old one with.
 */
export function replaceNode(oldNode: JSXNode, newNode: JSXNode): void {
    if (oldNode === newNode) {
        return;
    }

    // Call replace listeners once. The list of listeners is removed so it cannot be called again
    const listeners = oldNode[replaceListeners];
    if (listeners != null) {
        delete oldNode[replaceListeners];
        for (let i = 0, max = listeners.length; i < max; i++) {
            listeners[i](newNode);
        }
    }

     // Do the actual replacement. When old node is a range fragment then replacement must be passed through it to do some fragment magic
    if (oldNode instanceof RangeFragment) {
        oldNode.replaceWith(newNode);
    } else {
        oldNode.parentNode?.replaceChild(newNode, oldNode);
        destroyElement(oldNode);
    }
}

/**
 * Adds a replace listener function to call when the given node has been replaced by calling {@link replaceNode}. It is not called by any other means of
 * replacement, so make sure all node replacements are done by this function.
 *
 * @param node     - The node to listen on.
 * @param listener - The listener function to call with new node as parameter when given node is replaced.
 */
export function addNodeReplaceListener(node: JSXNode, listener: ReplaceListener): void {
    (node[replaceListeners] ??= []).push(listener);
}

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
        super.appendChild(this.#endAnchor);
        if (elements != null) {
            for (let i = 0, max = elements.length; i < max; i++) {
                this.appendChild(elements[i]);
            }
        }
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
        return this.#endAnchor.parentNode!;
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
        while (node != null && node !== this.#endAnchor) {
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
