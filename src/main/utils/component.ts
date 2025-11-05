/*
 * Copyright (C) 2025 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { type ClassDecorator, type Constructor, Context, type Qualifiers, Scope, injectable } from "@kayahr/cdi";

import { type ComponentClass, isComponentConstructor } from "../ClassComponent.ts";
import type { Element } from "./types.ts";

/**
 * Drops the first element from the given array and returns a type with the rest.
 *
 * @template T - The array type from which to drop the first element
 *
 * @internal
 */
export type DropFirst<T extends unknown[]> = T extends [ unknown, ...infer U] ? U : never;

/**
 * Component options.
 */
export interface ComponentOptions<T extends unknown[] = unknown[]> {
    /**
     * The types of the injected component parameters (constructor parameters for class components, function parameters for function components).
     * Must not contain the first parameter which is reserved for component input parameters.
     */
    inject: DropFirst<Qualifiers<T>>;
}

/**
 * Class decorator for specifying component options like inject types. This decorator (or its function pendant) must be used when component uses
 * dependency injection.
 *
 * @param options - The component options.
 */
export function component<P extends unknown[]>({ inject }: ComponentOptions<P>): ClassDecorator<ComponentClass, P>;

/**
 * Sets component options like inject types for the given component class. This function (or its decorator pendant) must be used when component uses
 * dependency injection.
 *
 * @param type    - The component class.
 * @param options - The component options.
 */
export function component<P extends unknown[]>(type: Constructor<ComponentClass, P>, { inject }: ComponentOptions<P>): void;

/**
 * Sets component options like inject types for the given component function. This function must be used when component uses
 * dependency injection.
 *
 * @param func    - The component function.
 * @param options - The component options.
 */
export function component<P extends unknown[]>(func: (...args: P) => Element, { inject }: ComponentOptions<P>): void;

export function component<P extends unknown[]>(...args:
      [ ComponentOptions<P> ]
    | [ Constructor<ComponentClass, P>, ComponentOptions<P> ]
    | [ (...args: P) => Element, ComponentOptions<P> ]
): void | ClassDecorator<ComponentClass, P> {
    if (args.length === 1) {
        return injectable({ inject: [ null, ...args[0].inject ] as Qualifiers<P>, scope: Scope.PROTOTYPE });
    } else {
        const [ source, options ] = args;
        if (isComponentConstructor(source)) {
            Context.getActive().setClass(source as Constructor<ComponentClass, P>,
                { inject: [ null, ...options.inject ] as Qualifiers<P>, scope: Scope.PROTOTYPE });
        } else {
            Context.getActive().setFunction(source as (...args: P) => Element, [ null, ...options.inject ] as Qualifiers<P>);
        }
    }
}
