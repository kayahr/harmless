/*
 * Copyright (C) 2025 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information.
 */

/**
 * Simple element reference which can be passed to a `ref` attribute on HTML elements.
 */
export class Reference<T extends HTMLElement = HTMLElement> {
    /** The references HTML element. Null if not set yet. */
    #element: T | null = null;

    /**
     * Sets the referenced HTML element.
     *
     * @param element - The HTML element to set.
     */
    public set(element: T): void {
        this.#element = element;
    }

    /**
     * @returns The referenced HTML element or null if not set yet.
     */
    public get(): T | null {
        return this.#element;
    }
}

/**
 * Short-form alias for creating a {@link Reference} object.
 */
export function ref<T extends HTMLElement>(): Reference<T> {
    return new Reference<T>();
}
