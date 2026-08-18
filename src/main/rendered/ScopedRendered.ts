/*
 * Copyright (C) 2026 Klaus Reimer
 * SPDX-License-Identifier: MIT
 */

import { type Scope, createScope } from "@kayahr/scope";
import { collectError, throwErrors } from "../errors.ts";
import { RenderedBase } from "./RenderedBase.ts";

/** Scoped wrapper rendered output disposing an owned signal scope together with its inner output. */
export class ScopedRendered extends RenderedBase {
    readonly #factory: (scope: Scope) => RenderedBase;
    #rendered: RenderedBase | null = null;
    #scope: Scope | null = null;

    /**
     * Creates a scoped wrapper around one lazily materialized inner output.
     *
     * @param factory - The factory creating the inner output inside the owned scope.
     */
    public constructor(factory: (scope: Scope) => RenderedBase) {
        super();
        this.#factory = factory;
        this.#ensureInitialized();
    }

    /**
     * Creates the current inner scope and output when they do not exist yet.
     *
     * @returns The initialized inner output.
     */
    #ensureInitialized(): RenderedBase {
        if (this.#rendered != null) {
            return this.#rendered;
        }
        const scope = createScope();
        try {
            const rendered = scope.run(() => this.#factory(scope));
            this.#scope = scope;
            this.#rendered = rendered;
            return rendered;
        } catch (error) {
            scope.dispose();
            throw error;
        }
    }

    /** @inheritdoc */
    protected override onInsert(parent: Node & ParentNode, before: ChildNode | null): void {
        this.#ensureInitialized().insert(parent, before);
    }

    /** @inheritdoc */
    public override getFirstNode(): ChildNode | null {
        return this.#rendered?.getFirstNode() ?? this.#ensureInitialized().getFirstNode();
    }

    /** @inheritdoc */
    public override getLastNode(): ChildNode | null {
        return this.#rendered?.getLastNode() ?? this.#ensureInitialized().getLastNode();
    }

    /** @inheritdoc */
    public override getSingleNode(): ChildNode | null {
        return this.#rendered?.getSingleNode() ?? this.#ensureInitialized().getSingleNode();
    }

    /** @inheritdoc */
    protected override onDispose(): void {
        this.#releaseCurrent(false);
    }

    /** @inheritdoc */
    protected override onDestroy(): void {
        this.#releaseCurrent(true);
    }

    /**
     * Releases the current inner output and scope.
     *
     * @param destroy - True to destroy the inner output, false to only dispose it.
     */
    #releaseCurrent(destroy: boolean): void {
        const rendered = this.#rendered;
        const scope = this.#scope;
        if (destroy) {
            this.#rendered = null;
        }
        this.#scope = null;
        const errors: unknown[] = [];
        if (rendered != null) {
            collectError(errors, () => {
                if (destroy) {
                    rendered.destroy();
                } else {
                    rendered.dispose();
                }
            });
        }
        if (scope != null) {
            collectError(errors, () => scope.dispose());
        }
        throwErrors(errors);
    }
}
