/*
 * Copyright (C) 2024 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information.
 */

import { type Subscribable, isSubscribable } from "@kayahr/observable";
import { computed } from "@kayahr/signal";

import { Context } from "./Context.ts";
import { RangeFragment, addNodeReplaceListener, connectElement, getElement, replaceNode } from "./JSXNode.ts";
import { PlaceholderNode } from "./PlaceholderNode.ts";
import { Reference } from "./utils/Reference.ts";
import type { Element } from "./utils/types.ts";

/**
 * Base class for JSX elements.
 */
export abstract class JSXElement<T extends Element = Element> {
    /** The component context. */
    protected context: Context | null = null;

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
        const context = new Context();
        const node: Node = new PlaceholderNode();
        void (async () => {
            const syncSource = await source;
            const newNode = context.runInContext(() => this.resolveNode(syncSource));
            connectElement(newNode, getElement(node));
            connectElement(node, null);
            replaceNode(node, newNode);
        })();
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
        const context = new Context();
        let node: Node = new PlaceholderNode();
        const subscription = source.subscribe(source => {
            const newNode = context.runInContext(() => this.resolveNode(source));
            addNodeReplaceListener(newNode, newNode => node = newNode);
            replaceNode(node, newNode);
            node = newNode;
        }, error => console.error(error));
        context.registerDestroyable({
            destroy: () => subscription.unsubscribe()
        });
        return node;
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
        if (source == null) {
            return document.createTextNode("");
        } else if (source instanceof Node) {
            return source;
        } else if (source instanceof JSXElement) {
            return source.createNode();
        } else if (source instanceof Array) {
            return new RangeFragment(source.map(source => this.resolveNode(source)));
        } else if (source instanceof Promise) {
            return this.resolveNodeFromPromise(source);
        } else if (isSubscribable(source)) {
            return this.resolveNodeFromObservable(source);
        } else if (source instanceof Function) {
            return this.resolveNode(computed(source as () => unknown));
        } else if (source instanceof Reference) {
            return this.resolveNode(source.get());
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
    protected runInContext<T>(fn: () => T): T {
        if (this.context == null) {
            Context.getCurrent()?.registerDestroyable(this);
            this.context = new Context();
        }
        return this.context.runInContext(fn);
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

    /** @inheritdoc */
    public createNode(): Node {
        if (this.#node != null) {
            return this.#node;
        }
        const element = this.doRender();
        const node = this.#node = this.runInContext(() => this.resolveNode(element));
        return connectElement(node, this);
    }

    /**
     * Destroys the component scope and all its child scopes. Called when the connected HTML element has been removed from the DOM.
     */
    public destroy(): void {
        const context = this.context;
        this.context = null;
        context?.destroy();
        this.#element = null;
        this.#node = null;
    }
}
