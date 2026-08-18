/*
 * Copyright (C) 2026 Klaus Reimer
 * SPDX-License-Identifier: MIT
 */

import { Group } from "./Group.ts";
import { RenderedBase } from "./RenderedBase.ts";

/**
 * Rendered output that starts empty and swaps in promised content once it resolves.
 */
export class AsyncRendered extends RenderedBase {
    readonly #group = new Group();
    #active = true;

    /**
     * Creates one async rendered output.
     *
     * @param promise - Promise resolving to the later rendered content.
     */
    public constructor(promise: Promise<RenderedBase>) {
        super();
        void this.#resolve(promise);
    }

    /**
     * Resolves promised content and swaps it into the internal placeholder group.
     *
     * @param promise - Promise resolving to the later rendered content.
     */
    async #resolve(promise: Promise<RenderedBase>): Promise<void> {
        try {
            const rendered = await promise;
            if (!this.#active) {
                rendered.dispose();
                return;
            }
            this.#group.replaceChildren(rendered);
        } catch (error: unknown) {
            if (!this.#active) {
                return;
            }
            queueMicrotask(() => {
                throw error;
            });
        }
    }

    /** @inheritdoc */
    protected override onInsert(parent: Node & ParentNode, before: ChildNode | null): void {
        this.#group.insert(parent, before);
    }

    /** @inheritdoc */
    public override getFirstNode(): ChildNode | null {
        return this.#group.getFirstNode();
    }

    /** @inheritdoc */
    public override getLastNode(): ChildNode | null {
        return this.#group.getLastNode();
    }

    /** @inheritdoc */
    public override getSingleNode(): ChildNode | null {
        return this.#group.getSingleNode();
    }

    /** @inheritdoc */
    protected override onDispose(): void {
        this.#active = false;
        this.#group.dispose();
    }

    /** @inheritdoc */
    protected override onDestroy(): void {
        this.#active = false;
        this.#group.destroy();
    }
}
