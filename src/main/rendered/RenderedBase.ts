/*
 * Copyright (C) 2026 Klaus Reimer
 * SPDX-License-Identifier: MIT
 */

import { collectError, throwErrors } from "../errors.ts";
import type { Group } from "./Group.ts";
import { Rendered } from "./Rendered.ts";

/**
 * Internal concrete runtime base class for all materialized rendered output.
 *
 * @internal
 */
export abstract class RenderedBase extends Rendered {
    readonly #disposeCallbacks: Array<() => void> = [];
    readonly #destroyCallbacks: Array<() => void> = [];
    #parentGroup: Group | null = null;
    #previousSibling: RenderedBase | null = null;
    #nextSibling: RenderedBase | null = null;
    #disposed = false;
    #destroyed = false;
    #released = false;

    /**
     * Creates one concrete rendered runtime output.
     */
    protected constructor() {
        super();
    }

    /**
     * Inserts this rendered output into the given parent.
     *
     * @param parent - The parent receiving this output.
     * @param before - Optional sibling to insert before.
     */
    public insert(parent: Node & ParentNode, before: ChildNode | null): void {
        this.assertUsable();
        this.#destroyed = false;
        this.#released = false;
        this.onInsert(parent, before);
    }

    /**
     * Returns the first DOM node currently owned by this output.
     *
     * @returns The first DOM node or null.
     */
    public abstract getFirstNode(): ChildNode | null;

    /**
     * Returns the last DOM node currently owned by this output.
     *
     * @returns The last DOM node or null.
     */
    public abstract getLastNode(): ChildNode | null;

    /**
     * Returns the single root node when this output resolves to exactly one node.
     *
     * @returns The single root node or null.
     */
    public abstract getSingleNode(): ChildNode | null;

    /**
     * Registers cleanup executed when this output is disposed or destroyed.
     *
     * @param callback - The cleanup callback.
     */
    protected addDisposeCallback(callback: () => void): void {
        this.#disposeCallbacks.push(callback);
    }

    /**
     * Registers cleanup executed only when this output is destroyed.
     *
     * @param callback - The destroy callback.
     */
    protected addDestroyCallback(callback: () => void): void {
        this.#destroyCallbacks.push(callback);
    }

    /** Disposes reactive resources owned by this output without touching the DOM. */
    public dispose(): void {
        if (this.#disposed) {
            return;
        }
        this.#disposed = true;
        const errors: unknown[] = [];
        collectError(errors, () => this.onDispose());
        errors.push(...this.#runReleaseCallbacks());
        throwErrors(errors);
    }

    /** Removes this output from the DOM and releases owned resources so it can be inserted again later. */
    public destroy(): void {
        if (this.#destroyed) {
            return;
        }
        this.#destroyed = true;
        const errors: unknown[] = [];
        collectError(errors, () => this.onDestroy());
        for (const callback of this.#destroyCallbacks) {
            collectError(errors, callback);
        }
        errors.push(...this.#runReleaseCallbacks());
        throwErrors(errors);
    }

    /**
     * Throws when this rendered output was already disposed permanently.
     */
    protected assertUsable(): void {
        if (this.#disposed) {
            throw new Error("Cannot use a disposed rendered output");
        }
    }

    /**
     * Returns the current owning group of the given rendered output, if any.
     *
     * @param rendered - The rendered output to inspect.
     * @returns The current owner or null.
     */
    protected static getParentGroup(rendered: RenderedBase): Group | null {
        return rendered.#parentGroup;
    }

    /**
     * Updates the current owning group of the given rendered output.
     *
     * @param rendered - The rendered output to update.
     * @param parent   - The new owner or null.
     */
    protected static setParentGroup(rendered: RenderedBase, parent: Group | null): void {
        rendered.#parentGroup = parent;
    }

    /**
     * Returns the previous sibling of the given rendered output inside its owning group, if any.
     *
     * @param rendered - The rendered output to inspect.
     * @returns The previous sibling or null.
     */
    protected static getPreviousSibling(rendered: RenderedBase): RenderedBase | null {
        return rendered.#previousSibling;
    }

    /**
     * Updates the previous sibling of the given rendered output.
     *
     * @param rendered - The rendered output to update.
     * @param sibling  - The previous sibling or null.
     */
    protected static setPreviousSibling(rendered: RenderedBase, sibling: RenderedBase | null): void {
        rendered.#previousSibling = sibling;
    }

    /**
     * Returns the next sibling of the given rendered output inside its owning group, if any.
     *
     * @param rendered - The rendered output to inspect.
     * @returns The next sibling or null.
     */
    protected static getNextSibling(rendered: RenderedBase): RenderedBase | null {
        return rendered.#nextSibling;
    }

    /**
     * Updates the next sibling of the given rendered output.
     *
     * @param rendered - The rendered output to update.
     * @param sibling  - The next sibling or null.
     */
    protected static setNextSibling(rendered: RenderedBase, sibling: RenderedBase | null): void {
        rendered.#nextSibling = sibling;
    }

    /**
     * Runs release callbacks exactly once for the current live cycle.
     *
     * @returns Collected release errors.
     */
    #runReleaseCallbacks(): unknown[] {
        if (this.#released) {
            return [];
        }
        this.#released = true;
        const errors: unknown[] = [];
        for (const callback of this.#disposeCallbacks) {
            collectError(errors, callback);
        }
        return errors;
    }

    /**
     * Hook executed exactly once before dispose callbacks run.
     */
    protected onDispose(): void {
        // Intentionally empty.
    }

    /**
     * Hook executed exactly once before destroy callbacks and release callbacks run.
     */
    protected onDestroy(): void {
        // Intentionally empty.
    }

    /**
     * Hook executing the actual DOM insertion logic.
     *
     * @param parent - The parent receiving this output.
     * @param before - Optional sibling to insert before.
     */
    protected abstract onInsert(parent: Node & ParentNode, before: ChildNode | null): void;
}
