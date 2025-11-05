/*
 * Copyright (C) 2024 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information.
 */

import { Context } from "@kayahr/cdi";

import { Component } from "./Component.ts";
import type { Element, Properties } from "./utils/types.ts";

/** Type of a function creating a JSX Element. */
export type ComponentFunction<T extends Properties = Properties, R extends Element = Element> = (props: T, ...injects: any[]) => R;

/**
 * JSX element for rendering a function component.
 */
export class FunctionComponent<T extends ComponentFunction<P, R>, P extends Properties = Properties, R extends Element = Element> extends Component<T, P, R> {
    /** The element properties. */
    readonly #properties: P;

    /**
     * Creates a new function element.
     *
     * @param func       - The element function.
     * @param properties - The element properties.
     */
    public constructor(func: T, properties: P) {
        super(func);
        this.#properties = properties;
    }

    /** @inheritdoc */
    protected doRender(): R | Promise<R> {
        const context = Context.getActive();
        if (context.has(this.source)) {
            // When DI context knows the component function then resolve it with dependency injection. During dependency resolving the signal scope
            // must be deactivated because otherwise signal created in dependencies are destroyed together with this component
            const func = context.get(this.source);
            if (func instanceof Promise) {
                // When resolved function is asynchronous because one of its dependencies is asynchronous then insert placeholder node
                // and replace it later when promise is resolved
                return (async () => {
                    const syncFunc = await func;
                    // Render the now resolved component function in the signal scope of this function element
                    return this.runInContext(() => syncFunc(this.#properties));
                })();
            } else {
                // Component function was resolved synchronously, so call it synchronously
                return this.runInContext(() => func(this.#properties));
            }
        } else {
            // No dependency injection is used, call component function normally
            return this.runInContext(() => this.source(this.#properties));
        }
    }
}
