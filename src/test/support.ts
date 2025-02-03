/*
 * Copyright (C) 2025 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { RangeFragment, RangeFragmentEnd, RangeFragmentStart } from "../main/RangeFragment.js";

/**
 * Dumps the given node into a string which can easily be compared in unit tests. Document fragments which were prepared for dumping with
 * {@link createFragment} will show start and end tags containing the optional fragment name.
 *
 * @param node - The node to dump.
 * @returns The node dumped to a string.
 */
export function dump(node: Node): string {
    if (node instanceof RangeFragment) {
        return Array.from(node.childNodes).map(node => dump(node)).join("");
    } else {
        if (node instanceof RangeFragmentStart) {
            return `<${node.ownerFragment.toString()}>`;
        }
        if (node instanceof RangeFragmentEnd) {
            return `</${node.ownerFragment.toString()}>`;
        }
        if (node instanceof Text) {
            return String(node.textContent);
        }
        const tagName = node.nodeName.toLowerCase();
        return `<${tagName}>${Array.from(node.childNodes).map(node => dump(node)).join("")}</${tagName}>`;
    }
}

/**
 * Creates a document fragments and sets some toString methods so the fragment structure can be dumped into an easily comparable string for the unit
 * tests.
 *
 * @param name - Optional fragment name used in the start and end anchor tags of the fragment dump. Defaults to empty string.
 * @returns The created document fragments prepared for dumping.
 */
export function createFragment(name: string = ""): RangeFragment {
    const fragment = new RangeFragment();
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
