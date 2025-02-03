/*
 * Copyright (C) 2024 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information.
 */

import { type JSXElement } from "./JSXElement.js";
import { RangeFragment } from "./RangeFragment.js";

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
