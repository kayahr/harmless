/*
 * Copyright (C) 2026 Klaus Reimer
 * SPDX-License-Identifier: MIT
 */

import { type JSX, JSXNode, type ParentProps } from "../jsx.ts";

/** Props accepted by {@link Choose}. */
export type ChooseProps = ParentProps;

/** Props accepted by {@link When}. */
export interface WhenProps extends ParentProps {
    /** Static or reactive boolean test controlling whether this branch is selected. */
    test: boolean | (() => boolean);
}

/** Props accepted by {@link Otherwise}. */
export type OtherwiseProps = ParentProps;

/**
 * Selects the first branch whose test is true.
 *
 * @param whens    - The branches to test in order.
 * @param otherwise - The fallback content.
 * @returns The selected branch content.
 */
function select(whens: readonly WhenProps[], otherwise: JSX.Element): JSX.Element {
    for (const when of whens) {
        const matches = typeof when.test === "function" ? when.test() : when.test;
        if (matches) {
            return when.children ?? null;
        }
    }
    return otherwise;
}

/**
 * Renders the first {@link When} child whose test is true, or the first {@link Otherwise} child when no test matches.
 *
 * @param props - The component props.
 * @returns The selected branch.
 */
export function Choose({ children }: ChooseProps): JSX.Element {
    const entries: readonly JSX.Element[] = Array.isArray(children) ? children : [ children ];
    const whens: WhenProps[] = [];
    let otherwise: JSX.Element = null;
    let hasOtherwise = false;

    for (const entry of entries) {
        if (!(entry instanceof JSXNode)) {
            continue;
        }
        if (entry.type === When) {
            whens.push(entry.props as WhenProps);
        } else if (entry.type === Otherwise && !hasOtherwise) {
            otherwise = (entry.props as unknown as OtherwiseProps).children ?? null;
            hasOtherwise = true;
        }
    }

    return whens.some(when => typeof when.test === "function")
        ? () => select(whens, otherwise)
        : select(whens, otherwise);
}

/**
 * Declares a tested branch for a parent {@link Choose} component.
 *
 * @param props - The component props.
 * @returns The branch children when rendered directly.
 */
export function When({ children = null }: WhenProps): JSX.Element {
    return children;
}

/**
 * Declares the fallback branch for a parent {@link Choose} component.
 *
 * @param props - The component props.
 * @returns The branch children when rendered directly.
 */
export function Otherwise({ children = null }: OtherwiseProps): JSX.Element {
    return children;
}
