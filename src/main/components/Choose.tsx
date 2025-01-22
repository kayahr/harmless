/*
 * Copyright (C) 2025 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { getChildComponent, getChildRenderings } from "../utils/children.js";
import type { Element } from "../utils/types.js";

/**
 * Renders the first {@link When} child component matching its test expression. If no {@link When} child matches then the {@link Otherwise} child is
 * rendered.
 */
export function Choose({ children }: { children?: Element }): Element {
    const whens = getChildRenderings(children, When);
    const otherwise = getChildComponent(children, Otherwise);
    return <>{() => whens.find(when => when.test())?.children ?? otherwise}</>;
}

/**
 * The children of this component are rendered by {@link Choose} when no {@link When} component matches.
 */
export function Otherwise<T extends Element>({ children }: { children: T }): T {
    return children;
}

/**
 * Properties for {@link When} component.
 */
export type WhenProperties = {
    /** Function or signal returning a boolean. When true, then children are rendered, as long as no previous {@link When} component matched. */
    test: () => boolean;

    /** Th children to render if test function/signal returns true. */
    children: Element;
};

/**
 * Renders its children when the test function/signal returns true and no previous `When` component matched.
 *
 * @param properties - The component properties.
 */
export function When({ test, children }: WhenProperties): WhenProperties {
    return { test, children };
}
