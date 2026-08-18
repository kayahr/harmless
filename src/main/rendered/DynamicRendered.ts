/*
 * Copyright (C) 2026 Klaus Reimer
 * SPDX-License-Identifier: MIT
 */

import { dispose } from "@kayahr/scope";
import { createEffect } from "@kayahr/signal";
import { collectError, throwErrors } from "../errors.ts";
import { Group } from "./Group.ts";
import { RenderedBase } from "./RenderedBase.ts";

/** Dynamic rendered output anchored by one managed group. */
export class DynamicRendered extends RenderedBase {
    readonly #factory: () => RenderedBase;
    #group: Group | null = null;
    #effect: ReturnType<typeof createEffect> | null = null;

    /**
     * Creates a dynamic rendered output which replaces its inner content whenever the factory reruns.
     *
     * @param factory - The reactive factory creating the current child output.
     */
    public constructor(factory: () => RenderedBase) {
        super();
        this.#factory = factory;
        this.#ensureInitialized();
    }

    /**
     * Creates the current group and reactive effect when they do not exist yet.
     *
     * @returns The initialized inner group.
     */
    #ensureInitialized(): Group {
        if (this.#group != null) {
            return this.#group;
        }
        const group = new Group();
        const effect = createEffect(() => {
            group.replaceChildren(this.#factory());
        });
        this.#group = group;
        this.#effect = effect;
        return group;
    }

    /** @inheritdoc */
    protected override onInsert(parent: Node & ParentNode, before: ChildNode | null): void {
        this.#ensureInitialized().insert(parent, before);
    }

    /** @inheritdoc */
    public override getFirstNode(): ChildNode | null {
        return this.#group?.getFirstNode() ?? this.#ensureInitialized().getFirstNode();
    }

    /** @inheritdoc */
    public override getLastNode(): ChildNode | null {
        return this.#group?.getLastNode() ?? this.#ensureInitialized().getLastNode();
    }

    /** @inheritdoc */
    public override getSingleNode(): ChildNode | null {
        return null;
    }

    /** @inheritdoc */
    protected override onDispose(): void {
        const effect = this.#effect;
        const group = this.#group!;
        this.#effect = null;
        if (effect == null) {
            return;
        }
        const errors: unknown[] = [];
        collectError(errors, () => dispose(effect));
        collectError(errors, () => group.dispose());
        throwErrors(errors);
    }

    /** @inheritdoc */
    protected override onDestroy(): void {
        const effect = this.#effect;
        const group = this.#group!;
        this.#effect = null;
        this.#group = null;
        const errors: unknown[] = [];
        if (effect != null) {
            collectError(errors, () => dispose(effect));
        }
        collectError(errors, () => group.destroy());
        throwErrors(errors);
    }
}
