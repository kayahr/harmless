/*
 * Copyright (C) 2024 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information.
 */

import { isSubscribable, type Subscribable } from "@kayahr/observable";
import { computed, SignalScope } from "@kayahr/signal";

import { JSXDocumentFragment } from "./JSXDocumentFragment.js";
import { addNodeReplaceListener, connectElement, destroyElement, getElement, replaceNode } from "./JSXNode.js";
import { JSXPlaceholder } from "./JSXPlaceholder.js";
import { Reference } from "./utils/Reference.js";
import type { Element } from "./utils/types.js";

/**
 * Base class for JSX elements.
 */
export abstract class JSXElement<T extends Element = Element> {
    /** The component scope (which is at the same time also the signal scope, so we borrow the functionality from there). */
    protected scope: SignalScope | null = null;

    /** Cached node created for this component. Null if not rendered yet. */
    #node: Node | null = null;

    /** Cached JSX element created for this component. Null if not created yet. */
    #element: T | Promise<T> | null = null;

    /**
     * Resolves a child from a promise. It creates a temporary empty text node which can be added to the DOM immediately. Then the promise is resolved
     * asynchronously to the real node which then replaces the temporary node.
     *
     * @param source - The promise to resolve.
     * @returns Temporary empty text node which is replaced with the real node as soon as available.
     */
    protected resolveNodeFromPromise(source: Promise<unknown>): Node {
        const node: Node = new JSXPlaceholder();
        void source.then(source => {
            const newNode = this.resolveNode(source);
            connectElement(newNode, getElement(node));
            connectElement(node, null);
            replaceNode(node, newNode);
        });
        return node;
    }

    /**
     * Resolves a child from an observable. It creates an initial temporary empty text node which can be added to the DOM immediately. This node is replaced
     * later with a real node when the observable emits its first value. And then on each new emitted value the current node is replaced again with a new node,
     * until the observable is canceled by an error or completes. The observable is automatically unsubscribed when a new value is emitted but the node
     * generated for the previous element has been garbage-collected.
     *
     * @param source - The observable to subscribe to.
     * @returns Initial empty text node which is replaced with the first real node as soon as available and then updated every time a new value is emitted.
     */
    protected resolveNodeFromObservable(source: Subscribable): Node {
        let nodeRef: WeakRef<Node> = new WeakRef(new JSXPlaceholder());
        const subscription = source.subscribe(source => {
            const node = nodeRef.deref();
            if (node != null) {
                const newNode = this.resolveNode(source);
                addNodeReplaceListener(newNode, newNode => nodeRef = new WeakRef(newNode));
                replaceNode(node, newNode);
                destroyElement(node);
                nodeRef = new WeakRef(newNode);
            } else {
                subscription.unsubscribe();
            }
        }, error => console.error(error));
        return nodeRef.deref() as Node;
    }

    /**
     * Recursively resolves a child which can be one of the following types:
     *
     * - null or undefined. Is resolved into an empty text node.
     * - An already resolved DOM node. Nothing needs to be resolved in this case.
     * - A JSX element. The element is rendered into a HTML element.
     * - A promise. A temporary empty text node is created and replaced with the real node later.
     * - An observable. Initially a new empty node is created, the observable is subscribed and then the current node is replaced with the new one every time a
     *   new value has been emitted by the observable. Observing stops when the node is garbage-collected or the observable reports an error or completes.
     * - A function. It is called (without parameters) and then the returned value is recursively resolved into a node.
     * - Any other value. It is converted to a string and wrapped into a text node.
     *
     * @param source - The source to resolve.
     * @returns The created node which can be inserted into the DOM.
     */
    protected resolveNode(source: unknown): Node {
        if (source instanceof Reference) {
            source = source.get();
        }
        if (source == null) {
            return document.createTextNode("");
        } else if (source instanceof Node) {
            return source;
        } else if (source instanceof JSXElement) {
            return source.createNode();
        } else if (source instanceof Array) {
            const node = new JSXDocumentFragment();
            for (const child of source) {
                node.appendChild(this.resolveNode(child));
            }
            return node;
        } else if (source instanceof Promise) {
            return this.resolveNodeFromPromise(source);
        } else if (isSubscribable(source)) {
            return this.resolveNodeFromObservable(source);
        } else if (source instanceof Function) {
            return this.resolveNode(computed(source as () => unknown));
        } else {
            return document.createTextNode(String(source));
        }
    }

    /**
     * Runs the given function within the elements signal scope which is created when not already present.
     *
     * @param fn - The function to run in the signal scope.
     * @returns The function result.
     */
    protected runInScope<T>(fn: () => T): T {
        if (this.scope == null) {
            this.scope = new SignalScope();
            SignalScope.registerDestroyable(this);
        }
        return this.scope.runInScope(fn);
    }

    /**
     * Renders this JSX element.
     *
     * @returns The created JSX element.
     */
    protected abstract doRender(): T | Promise<T>;

    /**
     * Renders this JSX element.
     *
     * @returns The created JSX element.
     */
    public render(): T | Promise<T> {
        if (this.#element != null) {
            return this.#element;
        }
        return this.#element = this.doRender();
    }

    /**
     * Renders this JSX element synchronously. Throws an error when it encounters a promise.
     *
     * @returns The created JSX element.
     */
    public renderSync(): T {
        const result = this.render();
        if (result instanceof Promise) {
            throw new Error("Synchronous rendering requested but promise encountered");
        }
        return result;
    }

    /** @inheritDoc */
    public createNode(): Node {
        if (this.#node != null) {
            return this.#node;
        }
        const element = this.doRender();
        const node = this.#node = this.runInScope(() => this.resolveNode(element));
        return connectElement(node, this);
    }

    /**
     * Destroys the component scope and all its child scopes. Called when the connected HTML element has been removed from the DOM.
     */
    public destroy(): void {
        this.scope?.destroy();
        this.scope = null;
        this.#element = null;
        this.#node = null;
    }
}
