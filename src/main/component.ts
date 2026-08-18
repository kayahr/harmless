/*
 * Copyright (C) 2026 Klaus Reimer
 * SPDX-License-Identifier: MIT
 */

import type { Qualifier } from "@kayahr/di";
import type { Component, ComponentContext, ComponentContextToken, ComponentInstance, JSX } from "./jsx.ts";

/**
 * Internal symbol used to store explicit DI metadata on a component value.
 *
 * This keeps the metadata on the component itself without polluting the public
 * surface with ordinary string properties or requiring an external registry.
 */
const componentMetadata = Symbol("component");

/**
 * One injectable component dependency qualifier.
 *
 * This is either a DI qualifier or the special {@link ComponentContext}
 * token for requesting the current component lifecycle context.
 *
 * @param T - The expected dependency type.
 */
export type ComponentDependency<T> = NoInfer<Qualifier<T> | (ComponentContext extends T ? ComponentContextToken : never)>;

/**
 * Injectable dependency qualifiers matching a component parameter list.
 *
 * @param T - The component dependency parameter types after the props argument.
 */
export type ComponentDependencies<T extends unknown[] = unknown[]> = NoInfer<{ [K in keyof T ]: ComponentDependency<T[K]> }>;

type DecoratedComponent<P, I extends unknown[] = []> = Component<P, I> & {
    [componentMetadata]?: Readonly<ComponentDependencies<I>>;
};

function setComponentMetadata(component: Component<any, any>, dependencies: ReadonlyArray<ComponentDependency<unknown>>): void {
    (component as DecoratedComponent<any, any>)[componentMetadata] = [ ...dependencies ];
}

/**
 * Attaches explicit dependency injection metadata to a function component.
 *
 * The returned component is the original function, so unit tests can still call
 * it directly with explicit dependency arguments.
 *
 * @param component    - The function component.
 * @param dependencies - The dependency qualifiers matching the component
 *                       parameters after the props argument.
 * @template C - The function component type.
 * @returns The original function component.
 */
export function component<C extends (props: any, ...dependencies: any[]) => JSX.Element>(
    component: C,
    dependencies: ComponentDependencies<
        C extends (props: any, ...dependencies: infer I) => JSX.Element ? I : never
    >
): C;

/**
 * Attaches explicit dependency injection metadata to a class component.
 *
 * The returned component is the original constructor, so unit tests can still
 * instantiate it directly with explicit dependency arguments.
 *
 * @param component    - The class component.
 * @param dependencies - The dependency qualifiers matching the constructor
 *                       parameters after the props argument.
 * @template C - The class component type.
 * @returns The original class component.
 */
export function component<C extends new (props: any, ...dependencies: any[]) => ComponentInstance>(
    component: C,
    dependencies: ComponentDependencies<
        C extends new (props: any, ...dependencies: infer I) => ComponentInstance ? I : never
    >
): C;

/**
 * Creates an ECMAScript class decorator attaching dependency metadata to a
 * class component.
 *
 * @param dependencies - The dependency qualifiers matching the constructor
 *                       parameters after the props argument.
 * @template D - The dependency metadata tuple.
 * @returns The class decorator.
 */
export function component<const D extends ReadonlyArray<ComponentDependency<unknown>>>(
    dependencies: [...D]
): <C extends new (props: any, ...dependencies: any[]) => ComponentInstance>(
    value: C,
    context: ClassDecoratorContext<C>
) => void;

export function component(...args: [ Component<any, any>, ReadonlyArray<ComponentDependency<unknown>> ] | [ ReadonlyArray<ComponentDependency<unknown>> ]):
        Component<any, any> | ((value: new (...args: any[]) => ComponentInstance, context: ClassDecoratorContext) => void) {
    if (args.length === 1) {
        const [ dependencies ] = args;
        return (value: new (...args: any[]) => ComponentInstance): void => {
            setComponentMetadata(value, dependencies);
        };
    }
    const [ value, dependencies ] = args;
    setComponentMetadata(value, dependencies);
    return value;
}

/**
 * Returns explicit dependency metadata attached to the given component.
 *
 * @param component - The component to inspect.
 * @returns The dependency qualifiers or null if no metadata exists.
 *
 * @internal
 */
export function getInjectedDependencies<P, I extends unknown[]>(component: Component<P, I>): Readonly<ComponentDependencies<I>> | null {
    return (component as DecoratedComponent<P, I>)[componentMetadata] ?? null;
}
