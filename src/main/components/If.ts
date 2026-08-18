/*
 * Copyright (C) 2026 Klaus Reimer
 * SPDX-License-Identifier: MIT
 */

import type { JSX, ParentProps } from "../jsx.ts";

/**
 * Props accepted by {@link If}.
 */
export interface IfProps extends ParentProps {
    /** Static or reactive boolean test controlling which branch is rendered. */
    test: boolean | (() => boolean);

    /** Optional fallback content rendered when the test is false. */
    else?: JSX.Element;
}

/**
 * Renders child content only when the given test is true.
 *
 * When `test` is a getter, the branch switches reactively.
 *
 * @param props - The component props.
 * @returns The selected branch.
 */
export function If({ test, children = null, else: otherwise = null }: IfProps): JSX.Element {
    if (typeof test !== "function") {
        return test ? children : otherwise;
    }
    return () => test() ? children : otherwise;
}
