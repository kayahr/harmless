/*
 * Copyright (C) 2026 Klaus Reimer
 * SPDX-License-Identifier: MIT
 */

/**
 * Opaque rendered handle returned by Harmless for already materialized child output.
 *
 * This public type intentionally exposes no DOM-manipulation or lifecycle API. Concrete
 * runtime implementations remain internal details.
 */
export abstract class Rendered {
    readonly #brand = true;

    /**
     * Creates one opaque rendered handle.
     */
    protected constructor() {
        void this.#brand;
    }
}
