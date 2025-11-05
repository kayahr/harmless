/*
 * Copyright (C) 2024 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information.
 */

import { ClassComponent, type ComponentConstructor, isComponentConstructor } from "./ClassComponent.ts";
import { type ComponentFunction, FunctionComponent } from "./FunctionComponent.ts";
import { IntrinsicElement } from "./IntrinsicElement.ts";
import type { Element, Properties } from "./utils/types.ts";

/** The element source which can be a intrinsic element tag name, an element factory function or an element class constructor. */
export type ElementSource = string | ComponentFunction | ComponentConstructor;

export function jsx(source: string, props: Record<string, unknown>, key?: unknown): Element;
export function jsx<T extends ComponentFunction<P, R>, P extends Properties, R extends Element>(source: T, props: P): FunctionComponent<T, P, R>;
export function jsx<T extends ComponentFunction<P & { key: K }, R>, P extends Record<string, unknown>, R extends Element, K>(source: T, props: P, key: K):
    FunctionComponent<T, P & { key: K }, R>;
export function jsx<T extends ComponentConstructor<P, R>, P extends Properties, R extends Element>(source: T, props: P): ClassComponent<T, P, R>;
export function jsx<T extends ComponentConstructor<P & { key: K }, R>, P extends Properties, R extends Element, K>(source: T, props: P, key: K):
    ClassComponent<T, P & { key: K }, R>;

/**
 * JSX element factory.
 *
 * @param source - The element source. Either an intrinsic element tag name, a reference to an HTML element factory function or a reference to an element
 *                 class constructor.
 * @param props  - The property map including the `children` element or array.
 * @param key    - React-specific key property value. We simply move it into the property map because we have no special use for it.
 * @returns The created HTML element.
 */
export function jsx(source: ElementSource, props: Properties, key?: unknown): Element {
    // We have no use for the special `key` property, so handle it like any other element property
    if (key != null) {
        props.key = key;
    }

    if (typeof source === "string") {
        // Source is an intrinsic element
        const children = props.children != null ? (props.children instanceof Array ? props.children : [ props.children ]) : [];
        delete props.children;
        return new IntrinsicElement(source, props, children);
    } else if (isComponentConstructor(source)) {
        // Source is a class element
        return new ClassComponent(source, props);
    } else {
        // Source is a function element
        return new FunctionComponent(source, props);
    }
}

/** Just an alias for the {@link jsx} function. There are no special optimizations for this call needed here. */
export const jsxs = jsx;

/** Just an alias for the {@link jsx} function. There is no special development behavior. */
export const jsxDEV = jsx;
