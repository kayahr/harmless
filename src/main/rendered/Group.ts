/*
 * Copyright (C) 2026 Klaus Reimer
 * SPDX-License-Identifier: MIT
 */

import { collectError, throwErrors } from "../errors.ts";
import { RenderedBase } from "./RenderedBase.ts";

/**
 * Concrete managed DOM group with stable start/end anchors and DOM-like child operations.
 */
export class Group extends RenderedBase {
    readonly #startAnchor = document.createComment("");
    readonly #endAnchor = document.createComment("");
    readonly #fragment = document.createDocumentFragment();
    #firstChild: RenderedBase | null = null;
    #lastChild: RenderedBase | null = null;

    /**
     * Creates one managed group optionally prefilled with child outputs.
     *
     * @param children - The initial child outputs.
     */
    public constructor(...children: RenderedBase[]) {
        super();
        this.#fragment.append(this.#startAnchor, this.#endAnchor);
        for (const child of children) {
            this.appendChild(child);
        }
    }

    /**
     * Appends one rendered child to the end of this group.
     *
     * @param child - The child to append.
     */
    public appendChild(child: RenderedBase): void {
        this.assertUsable();
        this.insertChildBefore(child, null);
    }

    /**
     * Inserts or moves one rendered child before another child in this group.
     *
     * Passing `null` inserts before the end anchor.
     *
     * @param child  - The child to insert or move.
     * @param before - The child to insert before, or null for appending.
     */
    public insertChildBefore(child: RenderedBase, before: RenderedBase | null): void {
        this.assertUsable();
        if (child === before) {
            return;
        }
        const beforeChild = before != null && Group.getParentGroup(before) === this ? before : null;
        child.insert(this.#getParent(), beforeChild?.getFirstNode() ?? this.#endAnchor);
        const currentOwner = Group.getParentGroup(child);
        if (currentOwner != null) {
            if (currentOwner === this) {
                this.#unlink(child);
            } else {
                currentOwner.#detachOwnedChild(child);
            }
        }

        if (beforeChild == null) {
            this.#appendChild(child);
        } else {
            this.#insertChildLinkBefore(child, beforeChild);
        }
        Group.setParentGroup(child, this);
    }

    /**
     * Removes one rendered child from this group and destroys it.
     *
     * @param child - The child to remove.
     */
    public removeChild(child: RenderedBase): void {
        this.assertUsable();
        if (!this.#detachOwnedChild(child)) {
            return;
        }
        child.destroy();
    }

    /**
     * Replaces all children inside this group.
     *
     * @param children - The new children.
     */
    public replaceChildren(...children: RenderedBase[]): void {
        this.assertUsable();
        this.clear();
        for (const child of children) {
            this.appendChild(child);
        }
    }

    /**
     * Clears all children inside this group.
     */
    public clear(): void {
        this.assertUsable();
        while (this.#lastChild != null) {
            this.removeChild(this.#lastChild);
        }
    }

    /**
     * Returns whether this group currently lives in the DOM.
     *
     * @returns True when the group has been inserted into a parent.
     */
    public isInserted(): boolean {
        return this.#endAnchor.parentNode != null && this.#endAnchor.parentNode !== this.#fragment;
    }

    /** @inheritdoc */
    protected override onInsert(parent: Node & ParentNode, before: ChildNode | null): void {
        if (before == null) {
            parent.append(this.#startAnchor, this.#endAnchor);
        } else {
            before.before(this.#startAnchor);
            before.before(this.#endAnchor);
        }
        for (let child = this.#firstChild; child != null; child = Group.getNextSibling(child)) {
            child.insert(parent, this.#endAnchor);
        }
    }

    /** @inheritdoc */
    public override getFirstNode(): ChildNode | null {
        return this.#startAnchor;
    }

    /** @inheritdoc */
    public override getLastNode(): ChildNode | null {
        return this.#endAnchor;
    }

    /** @inheritdoc */
    public override getSingleNode(): ChildNode | null {
        return null;
    }

    /** @inheritdoc */
    protected override onDispose(): void {
        const errors: unknown[] = [];
        for (let child = this.#firstChild; child != null; child = Group.getNextSibling(child)) {
            collectError(errors, () => child.dispose());
        }
        throwErrors(errors);
    }

    /** @inheritdoc */
    protected override onDestroy(): void {
        const errors: unknown[] = [];
        for (let child = this.#firstChild; child != null; child = Group.getNextSibling(child)) {
            collectError(errors, () => child.destroy());
        }
        collectError(errors, () => {
            this.#fragment.append(this.#startAnchor, this.#endAnchor);
        });
        throwErrors(errors);
    }

    /**
     * Returns the current DOM parent receiving child insertions.
     *
     * @returns The current parent node.
     */
    #getParent(): Node & ParentNode {
        return this.#endAnchor.parentNode as Node & ParentNode;
    }

    /**
     * Detaches one owned child from this group without destroying it.
     *
     * @param child - The child to detach.
     * @returns The detached child link or null.
     */
    #detachOwnedChild(child: RenderedBase): boolean {
        if (Group.getParentGroup(child) !== this) {
            return false;
        }
        Group.setParentGroup(child, null);
        this.#unlink(child);
        return true;
    }

    /**
     * Appends one child to the end of the internal child list.
     *
     * @param child - The child to append.
     */
    #appendChild(child: RenderedBase): void {
        if (this.#lastChild == null) {
            this.#firstChild = child;
            this.#lastChild = child;
            Group.setPreviousSibling(child, null);
            Group.setNextSibling(child, null);
            return;
        }
        Group.setPreviousSibling(child, this.#lastChild);
        Group.setNextSibling(child, null);
        Group.setNextSibling(this.#lastChild, child);
        this.#lastChild = child;
    }

    /**
     * Inserts one child before another child in the internal child list.
     *
     * @param child  - The child to insert.
     * @param before - The existing child to insert before.
     */
    #insertChildLinkBefore(child: RenderedBase, before: RenderedBase): void {
        const previousSibling = Group.getPreviousSibling(before);
        Group.setPreviousSibling(child, previousSibling);
        Group.setNextSibling(child, before);
        if (previousSibling == null) {
            this.#firstChild = child;
        } else {
            Group.setNextSibling(previousSibling, child);
        }
        Group.setPreviousSibling(before, child);
    }

    /**
     * Unlinks one child from the internal child list.
     *
     * @param child - The child to unlink.
     */
    #unlink(child: RenderedBase): void {
        const previousSibling = Group.getPreviousSibling(child);
        const nextSibling = Group.getNextSibling(child);
        if (previousSibling == null) {
            this.#firstChild = nextSibling;
        } else {
            Group.setNextSibling(previousSibling, nextSibling);
        }
        if (nextSibling == null) {
            this.#lastChild = previousSibling;
        } else {
            Group.setPreviousSibling(nextSibling, previousSibling);
        }
        Group.setPreviousSibling(child, null);
        Group.setNextSibling(child, null);
    }
}
