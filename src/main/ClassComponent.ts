/*
 * Copyright (C) 2024 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information.
 */

import { Context } from "@kayahr/cdi";

import { Component } from "./Component.js";
import { Context as HarmlessContext } from "./Context.js";
import type { Element, Properties } from "./utils/types.js";

/**
 * Interface to implement by component classes.
 *
 * @template T - The type of the rendered element.
 */
export interface ComponentClass<T extends Element = Element> {
    /**
     * Renders the component into a JSX element.
     *
     * @returns The created JSX element.
     */
    render(): T;

    /**
     * Called when component is destroyed.
     */
    onDestroy?(): void;
}

/**
 * Interface for the Constructor of a component class
 */
export interface ComponentConstructor<P extends Properties = Properties, R extends Element = Element> {
    prototype: ComponentClass<R>;
    new (props: P, ...injects: any[]): ComponentClass<R>;
}

/**
 * Checks if given object is a component constructor.
 *
 * @param obj - The object to check.
 * @returns True if object is a component constructor, false if not.
 */
export function isComponentConstructor(obj: unknown): obj is ComponentConstructor {
    return typeof obj === "function" && typeof (obj.prototype as ComponentClass)?.render === "function";
}

/**
 * JSX element for rendering a class component.
 */
export class ClassComponent<T extends ComponentConstructor<P, R>, P extends Properties = Properties, R extends Element = Element> extends Component<T, P, R> {
    /** The element properties. */
    readonly #properties: P;

    /**
     * Creates a new class element.
     *
     * @param elementClass - The element class to render.
     * @param properties   - The element properties.
     */
    public constructor(elementClass: T, properties: P) {
        super(elementClass);
        this.#properties = properties;
    }

    /** @inheritDoc */
    protected override doRender(): R | Promise<R> {
        let instance;
        const context = Context.getActive();
        if (context.has(this.source)) {
            // When DI context knows the component class then resolve it with dependency injection. During dependency resolving the signal scope
            // must be deactivated because otherwise signal created in dependencies are destroyed together with this component

            // TODO Sure that this must not run within signal scope to allow registering signals in constructor?
            instance = context.get(this.source, [ this.#properties ]);
            if (instance instanceof Promise) {
                // When resolved function is asynchronous because one of its dependencies is asynchronous then insert placeholder node
                // and replace it later when promise is resolved
                return instance.then(instance => {
                    // Render the now resolved element class in the signal scope of this function element
                    return this.runInContext(() => instance.render());
                }) as Promise<R>;
            }
        } else {
            instance = this.runInContext(() => new this.source(this.#properties));
        }
        // TODO Most likely not called in class component with asynchronous dependencies
        return this.runInContext(() => {
            if (instance.onDestroy != null) {
                HarmlessContext.getCurrent()?.registerDestroyable({ destroy: instance.onDestroy });
            }
            return instance.render();
        });
    }
}
