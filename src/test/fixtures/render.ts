/*
 * Copyright (C) 2024 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { render as renderElement } from "../../main/utils/render.js";
import type { Element } from "../../main/utils/types.js";

/**
 * Renders to given JSX element into a body element and returns this body element.
 *
 * @param element - The JSX element to render.
 * @returns A body element containing the rendered JSX element.
 */
export function render(element: Element): HTMLBodyElement {
    const root = document.createElement("body");
    root.appendChild(renderElement(element));
    return root;
}
