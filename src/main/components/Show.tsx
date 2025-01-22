/*
 * Copyright (C) 2024 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information.
 */

import { computed } from "@kayahr/signal";

import type { Element } from "../utils/types.js";

/**
 * Properties for the {@link Show} component.
 */
export interface ShowProperties {
    /**
     * The condition to control when the component body should be shown. Must be a function or a signal returning true to show the body, false to hide it and
     * instead show the optional fallback content.
     */
    when: () => boolean;

    /** The content to show when condition is true. */
    children?: unknown;

    /** Optional content to show when condition is false. Defaults to nothing. */
    fallback?: unknown;
}

/**
 * Component which conditionally shows content or optionally a fallback content instead.
 *
 * @param properties - The component properties.
 */
export function Show({ when, children, fallback = null }: ShowProperties): Element {
    return <>{computed(() => when() ? children : fallback)}</>;
}
