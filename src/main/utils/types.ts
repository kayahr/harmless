/*
 * Copyright (C) 2025 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information.
 */

import type { Observable } from "@kayahr/observable";
import type { Signal } from "@kayahr/signal";

import type { JSXElement } from "../JSXElement.ts";

/** Plain object recursively only allowing values of type {@link Element}. */
export interface ElementObject extends Record<string | symbol, Element> {}

/** The JSX element type. */
export type Element = JSXElement | Node | Signal<Element> | (() => Element) |  bigint | boolean | null | number | string | symbol | undefined | Element[]
    | Promise<Element> | Observable<Element> | ElementObject;

/** Component properties base type. */
export interface Properties extends Record<string, unknown> {}
