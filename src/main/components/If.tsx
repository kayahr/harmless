/*
 * Copyright (C) 2025 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information.
 */

import type { Element } from "../utils/types.js";

/**
 * Properties for the {@link If} component.
 */
export interface IfProperties {
    /** The condition to test. Must be a function or a signal returning a boolean. */
    test: () => boolean;

    /** Optional content to show when condition is true. If not set then the component children are used instead. */
    then?: unknown;

    /** Optional content to show when condition is false. */
    else?: unknown;

    /** Children shown when condition is true and no `then` property was set. */
    children?: unknown;
}

/**
 * Component which conditionally shows content.
 *
 * @param properties - The component properties.
 */
export function If({ test, children, then = children, else: otherwise }: IfProperties): Element {
    return <>{() => test() ? then : otherwise }</>;
}
