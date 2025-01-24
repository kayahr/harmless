/*
 * Copyright (C) 2024 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information.
 */

import { isSubscribable, type Subscribable } from "@kayahr/observable";
import { computed, WritableSignal } from "@kayahr/signal";

import { JSXElement } from "./JSXElement.js";
import { Reference } from "./utils/Reference.js";

/**
 * JSX element for rendering an intrinsic HTML element.
 */
export class IntrinsicElement extends JSXElement<Node> {
    /** The HTML element tag name. */
    readonly #tag: string;

    /** The HTML element properties. */
    readonly #properties: Record<string, unknown>;

    /** The element children. */
    readonly #children: unknown[];

    /** Map with remembered registered event listeners so they can be unregistered before a new one is registered. */
    readonly #eventListeners = new Map<string, EventListener>();

    /**
     * Creates a new intrinsic HTML element.
     *
     * @param tag        - The HTML element tag name.
     * @param properties - The HTML element properties.
     * @param children   - The element children.
     */
    public constructor(tag: string, properties: Record<string, unknown>, children: unknown[]) {
        super();
        this.#tag = tag;
        this.#properties = properties;
        this.#children = children;
    }

    /**
     * Sets an HTML element attribute from an observable. The observable is subscribed and the attribute is updated every time a new value is emitted.
     *
     * @param elementRef     - Weak reference on the HTML element on which to set the attribute. The observable is automatically unsubscribed when a new
     *                         value is emitted but the element has been garbage-collected.
     * @param attributeName  - The name of the attribute to set.
     * @param attributeValue - The observable to subscribe for attribute values.
     */
    #setAttributeValueFromObservable(elementRef: WeakRef<HTMLElement>, attributeName: string, attributeValue: Subscribable): void {
        const subscription = attributeValue.subscribe(value => {
            const element = elementRef.deref();
            if (element != null) {
                void this.#setAttributeValue(element, attributeName, value);
            } else {
                subscription.unsubscribe();
            }
        });
    }

    /**
     * Sets an HTML element attribute. The attribute value is resolved recursively and can be one of the following types:
     *
     * - Null or undefined. Removes the attribute if present.
     * - A promise. The promise result is awaited and then resolved further as attribute value.
     * - An observable. It is subscribed and the attribute is set every time a new value is emitted by the observable. Observing stops when the HTML element is
     *   garbage-collected or the observable reports an error or completes.
     * - A function. It is called (without parameters) and then the returned value is resolved further as attribute value.
     * - A boolean. When true then attribute is set with no value. When false then attribute is removed.
     * - Any other value. It is converted into a string and then used as attribute value.
     *
     * For event attributes (starting with "on" followed by an upper-case letter) the attribute value is treated as an event listener function. If the attribute
     * value is a function then it is registered as event listener after unregistering a previously registered event listener. If null or undefined then the
     * current event listener is unregistered. When a promise or observable then the current event listener is unregistered and a new one is registered as soon
     * as it is resolved into a function. When the resolved value in the end is not a primitive value then no event listener is registered and the attribute is
     * treated as normal attribute.
     *
     * @param element        - The HTML element on which to set the attribute.
     * @param attributeName  - The name of the attribute to set.
     * @param attributeValue - The value to set.
     */
    async #setAttributeValue(element: HTMLElement, attributeName: string, attributeValue: unknown): Promise<void> {
        if (attributeName === "ref") {
            if (attributeValue instanceof Reference || attributeValue instanceof WritableSignal) {
                attributeValue.set(element);
                return;
            } else if (attributeValue instanceof Function) {
                (attributeValue as (e: HTMLElement) => void)(element);
                return;
            }
        }

        // When attribute starts with "on" then assume it is and event. Remove previously registered event handler if present
        const eventName = attributeName.startsWith("on") ? attributeName.substring(2) : null;
        if (eventName != null) {
            const previousEventListener = this.#eventListeners.get(eventName);
            if (previousEventListener != null) {
                element.removeEventListener(eventName, previousEventListener);
                this.#eventListeners.delete(eventName);
            }
        }

        if (attributeValue == null) {
            element.removeAttribute(attributeName);
        } else if (attributeValue instanceof Promise) {
            return this.#setAttributeValue(element, attributeName, await attributeValue);
        } else if (isSubscribable(attributeValue)) {
            this.#setAttributeValueFromObservable(new WeakRef(element), attributeName, attributeValue);
        } else if (attributeValue instanceof Function) {
            if (eventName != null) {
                // Register new event handler
                const eventListener = attributeValue as EventListener;
                element.addEventListener(eventName, eventListener);
                this.#eventListeners.set(eventName, eventListener);
            } else {
                return this.#setAttributeValue(element, attributeName, computed(attributeValue as () => unknown));
            }
        } else if (typeof attributeValue === "boolean") {
            element.toggleAttribute(attributeName, attributeValue);
        } else if (attributeName === "style" && attributeValue.constructor === Object) {
            element.setAttribute(attributeName, Object.entries(attributeValue).map(([ key, value ]) => `${key}: ${value}`).join("; "));
        } else {
            element.setAttribute(attributeName, String(attributeValue));
        }
    }

    /** @inheritDoc */
    public doRender(): Node {
        return this.runInScope(() => {
            const element = document.createElement(this.#tag);
            for (const [ key, value ] of Object.entries(this.#properties)) {
                void this.#setAttributeValue(element, key, value);
            }
            for (const child of this.#children) {
                element.appendChild(this.resolveNode(child));
            }
            return element;
        });
    }
}
