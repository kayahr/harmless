/*
 * Copyright (C) 2025 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information.
 */

import { Component } from "../Component.ts";
import { ValueElement } from "../ValueElement.ts";
import type { Element } from "./types.ts";

/**
 * Renders the given JSX Element into a DOM node and returns it. This node should be added to the DOM or some other static HTML element immediately or
 * otherwise dynamic update of the returned node itself will be missed.
 *
 * @param element - The JSX element to render.
 * @returns The rendered DOM node.
 */
export function render(element: Element): Node {
    return (element instanceof Component ? element : new ValueElement(element)).createNode();
}
