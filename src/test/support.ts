/*
 * Copyright (C) 2025 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { JSXDocumentFragment, JSXDocumentFragmentEnd, JSXDocumentFragmentStart } from "../main/JSXDocumentFragment.js";
import { getFragment } from "../main/JSXNode.js";

/**
 * Dumps the given node into a string which can easily be compared in unit tests. Document fragments which were prepared for dumping with
 * {@link createFragment} will show start and end tags containing the optional fragment name.
 *
 * @param node - The node to dump.
 * @returns The node dumped to a string.
 */
export function dump(node: Node): string {
    if (node instanceof JSXDocumentFragment) {
        return Array.from(node.childNodes).map(node => dump(node)).join("");
    } else {
        const fragment = getFragment(node);
        if (fragment != null) {
            if (node instanceof JSXDocumentFragmentStart) {
                return `<${fragment.toString()}>`;
            } else if (node instanceof JSXDocumentFragmentEnd) {
                return `</${fragment.toString()}>`;
            }
        }
        if (node instanceof Text) {
            return String(node.textContent);
        } else {
            const tagName = node.nodeName.toLowerCase();
            return `<${tagName}>${Array.from(node.childNodes).map(node => dump(node)).join("")}</${tagName}>`;
        }
    }
}

/**
 * Helper function to return a list of owning document fragments.
 *
 * @param nodes - The list of nodes to check.
 * @returns Array with owning document fragments for each node or null if node is not part of a document fragment.
 */
export function getFragments(nodes: NodeListOf<Node>): Array<JSXDocumentFragment | null> {
    return Array.from(nodes).map(getFragment);
}

/**
 * Creates a document fragments and sets some toString methods so the fragment structure can be dumped into an easily comparable string for the unit
 * tests.
 *
 * @param name - Optional fragment name used in the start and end anchor tags of the fragment dump. Defaults to empty string.
 * @returns The created document fragments prepared for dumping.
 */
export function createFragment(name: string = ""): JSXDocumentFragment {
    const fragment = new JSXDocumentFragment();
    fragment.toString = () => name;
    return fragment;
}

/**
 * Sleeps for the given number of milliseconds.
 *
 * @param ms - The number of milliseconds to sleep. Defaults to 0 which means waiting a single macro task.
 */
export function sleep(ms: number = 0): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
