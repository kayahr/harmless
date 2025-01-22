/*
 * Copyright (C) 2024 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information.
 */

import type { Signal } from "@kayahr/signal";

import type { Reference } from "./utils/Reference.js";
import type { Element as ElementType } from "./utils/types.js";

/**
 * JSX namespace.
 *
 * @see https://www.typescriptlang.org/docs/handbook/jsx.html
 */
export namespace JSX {
    /** The JSX element type. */
    export type Element = ElementType;

    /** Interface for element classes. */
    export interface ElementClass {
        /**
         * Renders the component into a JSX element.
         *
         * @returns The created JSX element.
         */
        render(): JSX.Element;

        /**
         * Called when component is destroyed.
         */
        onDestroy?(): void;
    }

    /**
     * Defines that this library uses the `children` property name for specifying element children.
     *
     * @internal
     */
    export interface ElementChildrenAttribute {
        children: object;
    }

    /**
     * Special framework-handled intrinsic element attributes.
     *
     * @internal
     */
    export interface IntrinsicAttributes {
        /** Optional HTML element reference container the element is written to when rendered. */
        ref?: Reference | Signal<HTMLElement>;
    }

    /**
     * The intrinsic element definitions.
     *
     * TODO Replace catch-all with real type-safe definitions.
     *
     * @internal
     */
    export interface IntrinsicElements {
        [ name: string ]: unknown;
    }
}
