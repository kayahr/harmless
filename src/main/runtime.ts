/*
 * Copyright (C) 2026 Klaus Reimer
 * SPDX-License-Identifier: MIT
 */

import { type Qualifier, injector } from "@kayahr/di";
import { isSubscribable } from "@kayahr/observable";
import { type Scope, dispose, getActiveScope, getRootScope } from "@kayahr/scope";
import { type Setter, createEffect, toSignal } from "@kayahr/signal";
import { collectError, throwErrors } from "./errors.ts";
import { getInjectedDependencies } from "./component.ts";
import { type Component, type ComponentClass, ComponentContext, Fragment, type IntrinsicProps, type JSX, JSXNode } from "./jsx.ts";
import { AsyncRendered } from "./rendered/AsyncRendered.ts";
import { DynamicRendered } from "./rendered/DynamicRendered.ts";
import { Group } from "./rendered/Group.ts";
import { NodeRendered } from "./rendered/NodeRendered.ts";
import { RenderedBase } from "./rendered/RenderedBase.ts";
import { ScopedRendered } from "./rendered/ScopedRendered.ts";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const MATHML_NAMESPACE = "http://www.w3.org/1998/Math/MathML";
const XLINK_NAMESPACE = "http://www.w3.org/1999/xlink";
const XML_NAMESPACE = "http://www.w3.org/XML/1998/namespace";
let currentNamespace: string | null = null;
type RuntimeIntrinsicProps = IntrinsicProps & Record<string, unknown>;

/**
 * Returns the currently active child element namespace for materialization.
 *
 * @returns The active namespace URI or null for HTML.
 */
export function getCurrentNamespace(): string | null {
    return currentNamespace;
}

/**
 * Executes the given callback under a temporary child namespace.
 *
 * @param namespace - The namespace URI to activate, or null for HTML.
 * @param callback  - The code to execute under the given namespace.
 * @returns The callback result.
 */
export function withNamespace<T>(namespace: string | null, callback: () => T): T {
    const previousNamespace = currentNamespace;
    currentNamespace = namespace;
    try {
        return callback();
    } finally {
        currentNamespace = previousNamespace;
    }
}

/**
 * Derives the child element namespace from the given DOM parent.
 *
 * SVG children stay in the SVG namespace, MathML children stay in the MathML namespace,
 * and children of `foreignObject` switch back to HTML.
 *
 * @param parent - The DOM parent receiving new children.
 * @returns The child namespace URI or null for HTML.
 */
export function getParentChildNamespace(parent: Node): string | null {
    if (!(parent instanceof Element)) {
        return null;
    }
    if (parent.localName === "foreignObject" && parent.namespaceURI === SVG_NAMESPACE) {
        return null;
    }
    if (parent.namespaceURI === SVG_NAMESPACE || parent.namespaceURI === MATHML_NAMESPACE) {
        return parent.namespaceURI;
    }
    return null;
}

/**
 * Resolves the namespace for a newly created intrinsic element.
 *
 * @param parentNamespace - The currently active parent namespace.
 * @param tag             - The intrinsic tag name.
 * @returns The namespace URI for the new element, or null for HTML.
 */
function getElementNamespace(parentNamespace: string | null, tag: string): string | null {
    if (tag === "svg") {
        return SVG_NAMESPACE;
    }
    if (tag === "math") {
        return MATHML_NAMESPACE;
    }
    if (parentNamespace === SVG_NAMESPACE || parentNamespace === MATHML_NAMESPACE) {
        return parentNamespace;
    }
    return null;
}

/**
 * Resolves the namespace to use for intrinsic child content.
 *
 * @param elementNamespace - The namespace of the current intrinsic element.
 * @param tag              - The intrinsic tag name.
 * @returns The namespace URI for nested children, or null for HTML.
 */
function getChildNamespace(elementNamespace: string | null, tag: string): string | null {
    return tag === "foreignObject" ? null : elementNamespace;
}

/**
 * Creates one intrinsic DOM element in the given namespace.
 *
 * @param tag       - The intrinsic tag name.
 * @param namespace - The namespace URI, or null for HTML.
 * @returns The created DOM element.
 */
function createIntrinsicElement(tag: string, namespace: string | null): Element {
    return namespace == null
        ? document.createElement(tag)
        : document.createElementNS(namespace, tag);
}

/**
 * Resolves the DOM namespace for a supported namespaced attribute.
 *
 * @param name - The attribute name.
 * @returns The attribute namespace plus local name, or null for plain attributes.
 */
function getAttributeNamespace(name: string): { namespace: string; localName: string } | null {
    const separatorIndex = name.indexOf(":");
    if (separatorIndex === -1) {
        return null;
    }
    const prefix = name.slice(0, separatorIndex);
    const localName = name.slice(separatorIndex + 1);
    let namespace: string | null = null;
    if (prefix === "xlink") {
        namespace = XLINK_NAMESPACE;
    } else if (prefix === "xml") {
        namespace = XML_NAMESPACE;
    }
    return namespace == null ? null : { namespace, localName };
}

/**
 * Writes one DOM attribute, using `setAttributeNS` for supported namespaced attributes.
 *
 * @param element - The target element.
 * @param name    - The attribute name.
 * @param value   - The attribute value.
 */
function setElementAttribute(element: Element, name: string, value: string): void {
    const namespacedAttribute = getAttributeNamespace(name);
    if (namespacedAttribute == null) {
        element.setAttribute(name, value);
    } else {
        element.setAttributeNS(namespacedAttribute.namespace, name, value);
    }
}

/**
 * Removes one DOM attribute, using `removeAttributeNS` for supported namespaced attributes.
 *
 * @param element - The target element.
 * @param name    - The attribute name.
 */
function removeElementAttribute(element: Element, name: string): void {
    const namespacedAttribute = getAttributeNamespace(name);
    if (namespacedAttribute == null) {
        element.removeAttribute(name);
    } else {
        element.removeAttributeNS(namespacedAttribute.namespace, namespacedAttribute.localName);
    }
}

/**
 * Combines multiple cleanups into one idempotent cleanup.
 *
 * @param cleanups - The cleanup callbacks to combine.
 * @returns The combined cleanup.
 */
function combine(cleanups: ReadonlyArray<() => void>): () => void {
    return () => {
        const errors: unknown[] = [];
        for (const cleanup of cleanups) {
            collectError(errors, cleanup);
        }
        throwErrors(errors);
    };
}

/**
 * Materializes nested child content for direct insertion into a parent element.
 *
 * Arrays and static JSX fragments are flattened so ordinary elements do not receive
 * unnecessary range anchors for plain multi-child content.
 *
 * @param value - The child content to materialize.
 * @returns The materialized child outputs.
 */
function materializeChildren(value: JSX.Element): readonly RenderedBase[] {
    if (value == null) {
        return [];
    }
    if (Array.isArray(value)) {
        return value.flatMap(entry => materializeChildren(entry));
    }
    if (value instanceof JSXNode && value.type === Fragment) {
        return value.props.children == null ? [] : materializeChildren(value.props.children);
    }
    return [ materialize(value) ];
}

/**
 * Returns whether the given value is a DOM node.
 *
 * @param value - The value to test.
 * @returns True when the value is a DOM node.
 */
function isNode(value: unknown): value is ChildNode {
    return typeof Node !== "undefined" && value instanceof Node;
}

/**
 * Returns whether the given component must be instantiated as a class component.
 *
 * Class components either expose `render()` on their prototype or are declared
 * with class syntax and therefore must not be invoked like plain functions.
 *
 * @param component - The component to inspect.
 * @returns True when the component must be constructed with `new`.
 */
function isComponentClass<P, I extends unknown[]>(component: Component<P, I>): component is ComponentClass<P, I> {
    const prototype = (component as { prototype?: { render?: unknown } }).prototype;
    if (typeof prototype?.render === "function") {
        return true;
    }
    return Function.prototype.toString.call(component).startsWith("class ");
}

/**
 * Registers one optional class-component disposer on the given scope.
 *
 * @param scope    - The owning reactive scope.
 * @param instance - The class component instance.
 */
function registerComponentInstanceDispose(scope: Scope, instance: object): void {
    const dispose = (instance as { [Symbol.dispose]?: () => void })[Symbol.dispose];
    if (typeof dispose === "function") {
        scope.onDispose(() => {
            dispose.call(instance);
        });
    }
}

/**
 * Materializes one component after all of its dependencies are resolved.
 *
 * @param component    - The component function or class.
 * @param props        - The component props.
 * @param scope        - The owning reactive scope.
 * @param dependencies - The resolved dependency values.
 * @returns The rendered component output.
 */
function materializeResolvedComponent<P, I extends unknown[]>(
    component: Component<P, I>,
    props: P,
    scope: Scope,
    dependencies: I
): RenderedBase {
    if (isComponentClass(component)) {
        const instance = new component(props, ...dependencies);
        registerComponentInstanceDispose(scope, instance);
        return materialize(instance.render());
    }
    return materialize(component(props, ...dependencies));
}

/**
 * Writes the current DOM node to a ref signal.
 *
 * @param ref  - The signal setter to update.
 * @param node - The current node value.
 */
function setRef<T extends Node>(ref: Setter<T | null> | undefined, node: T | null): void {
    ref?.(node);
}

/**
 * Flattens one class value into the given class-name list.
 *
 * @param value      - The class value to flatten.
 * @param classNames - The destination class-name list.
 */
function flattenClass(value: unknown, classNames: string[]): void {
    if (typeof value === "string") {
        classNames.push(value);
    } else if (Array.isArray(value)) {
        for (const entry of value) {
            flattenClass(entry, classNames);
        }
    } else if (value != null && value !== false && typeof value === "object") {
        for (const [ className, enabled ] of Object.entries(value as Record<string, unknown>)) {
            if (enabled) {
                classNames.push(className);
            }
        }
    }
}

/**
 * Applies a class value to an element.
 *
 * @param element - The target element.
 * @param value   - The class value.
 */
function applyClass(element: Element, value: unknown): void {
    if (value == null || value === false) {
        removeElementAttribute(element, "class");
        return;
    }
    const classNames: string[] = [];
    flattenClass(value, classNames);
    setElementAttribute(element, "class", classNames.join(" "));
}

/**
 * Applies a style value to an element.
 *
 * @param element - The target element.
 * @param value   - The style value.
 */
function applyStyle(element: HTMLElement | SVGElement, value: unknown): void {
    if (value == null || value === false) {
        element.removeAttribute("style");
    } else if (typeof value === "string") {
        element.setAttribute("style", value);
    } else if (typeof value === "object") {
        element.removeAttribute("style");
        for (const [ key, entry ] of Object.entries(value as Record<string, unknown>)) {
            element.style.setProperty(key, entry == null ? "" : String(entry));
        }
    } else {
        element.setAttribute("style", String(value));
    }
}

/**
 * Applies an intrinsic property or attribute to an element.
 *
 * @param element - The target element.
 * @param name    - The property name.
 * @param value   - The property value.
 */
function applyProperty(element: Element, name: string, value: unknown): void {
    const domElement = element as unknown as Record<string, unknown>;
    const xml = element.namespaceURI === SVG_NAMESPACE || element.namespaceURI === MATHML_NAMESPACE;

    if (name === "class") {
        applyClass(element, value);
        return;
    }
    if (name === "style") {
        applyStyle(element as HTMLElement | SVGElement, value);
        return;
    }
    if (name.startsWith("aria-")) {
        if (value == null) {
            removeElementAttribute(element, name);
        } else {
            setElementAttribute(element, name, String(value));
        }
        return;
    }
    if (xml) {
        if (value == null || value === false) {
            removeElementAttribute(element, name);
            return;
        }
        if (value === true) {
            setElementAttribute(element, name, "");
            return;
        }
        setElementAttribute(element, name, String(value));
        return;
    }
    if (value == null || value === false) {
        if (name in element) {
            try {
                domElement[name] = typeof domElement[name] === "boolean" ? false : null;
            } catch {
                // Ignore failing DOM property writes and still remove the attribute.
            }
        }
        removeElementAttribute(element, name);
        return;
    }
    if (value === true) {
        setElementAttribute(element, name, "");
        if (name in element) {
            try {
                domElement[name] = true;
            } catch {
                // Ignore failing DOM property writes and keep the boolean attribute.
            }
        }
        return;
    }
    if (!name.includes("-") && name in element) {
        try {
            domElement[name] = value;
            return;
        } catch {
            // Fall back to attributes below.
        }
    }
    setElementAttribute(element, name, String(value));
}

/**
 * Applies nested getters, promises and observables to an intrinsic property.
 *
 * @param element - The target element.
 * @param name    - The property name.
 * @param value   - The value to apply.
 * @returns Cleanup for the reactive binding.
 */
function bindProperty(element: Element, name: string, value: unknown): () => void {
    if (value instanceof Promise) {
        const signal = toSignal(value);
        return combine([ bindProperty(element, name, signal), () => dispose(signal) ]);
    }
    if (isSubscribable(value)) {
        const signal = toSignal(value);
        return combine([ bindProperty(element, name, signal), () => dispose(signal) ]);
    }
    if (typeof value === "function") {
        const effect = createEffect(({ onCleanup }) => {
            onCleanup(bindProperty(element, name, value()));
        });
        return () => dispose(effect);
    }
    applyProperty(element, name, value);
    return () => {};
}

/**
 * Materializes a component invocation.
 *
 * @param component - The component function or class.
 * @param props     - The component props.
 * @returns The rendered component output.
 */
function materializeComponent<P, I extends unknown[]>(component: Component<P, I>, props: P): RenderedBase {
    const namespace = getCurrentNamespace();
    return new ScopedRendered(scope => withNamespace(namespace, () => {
        const context: ComponentContext = {
            onDispose(cleanup) {
                scope.onDispose(cleanup);
            }
        };
        const injectedDependencies = getInjectedDependencies(component) as ReadonlyArray<Qualifier | typeof ComponentContext> | null;
        const dependencyResults = injectedDependencies == null
            ? [ context ]
            : injectedDependencies.map(dependency =>
                dependency === ComponentContext
                    ? context
                    : injector.get(dependency, { scope }));
        if (dependencyResults.some(result => result instanceof Promise)) {
            return new AsyncRendered(Promise.all(dependencyResults).then(dependencies =>
                scope.run(() => withNamespace(namespace, () => materializeResolvedComponent(component, props, scope, dependencies as I)))
            ));
        }
        return materializeResolvedComponent(component, props, scope, dependencyResults as I);
    }));
}

/**
 * Materializes an intrinsic DOM element.
 *
 * @param tag   - The tag name.
 * @param props - The intrinsic props.
 * @returns The rendered element output.
 */
function materializeElement(tag: string, props: RuntimeIntrinsicProps): RenderedBase {
    const elementNamespace = getElementNamespace(getCurrentNamespace(), tag);
    const childNamespace = getChildNamespace(elementNamespace, tag);
    const element = createIntrinsicElement(tag, elementNamespace);
    const cleanups: Array<() => void> = [];

    for (const [ name, value ] of Object.entries(props)) {
        if (name === "children") {
            continue;
        }
        if (name === "ref") {
            setRef(value as Setter<Element | null>, element);
            cleanups.push(() => {
                setRef(value as Setter<Element | null>, null);
            });
            continue;
        }
        if (name.startsWith("on:") && typeof value === "function") {
            const eventName = name.slice(3);
            const listener = value as EventListener;
            element.addEventListener(eventName, listener);
            cleanups.push(() => {
                element.removeEventListener(eventName, listener);
            });
            continue;
        }
        if (typeof value === "function" || value instanceof Promise || isSubscribable(value)) {
            cleanups.push(bindProperty(element, name, value));
            continue;
        }
        applyProperty(element, name, value);
    }

    const children = props.children == null ? [] : withNamespace(childNamespace, () => materializeChildren(props.children));
    for (const child of children) {
        child.insert(element, null);
    }
    for (const child of children) {
        cleanups.push(() => {
            child.dispose();
        });
    }

    return new NodeRendered(element, combine(cleanups));
}

/**
 * Materializes any Harmless child value into DOM insertion logic.
 *
 * @param value - The value to materialize.
 * @returns The materialized output.
 */
export function materialize(value: JSX.Element): RenderedBase {
    if (value == null) {
        return new Group();
    }
    if (isNode(value)) {
        return new NodeRendered(value);
    }
    if (typeof value === "string" || typeof value === "number" || typeof value === "bigint" || typeof value === "boolean") {
        return new NodeRendered(document.createTextNode(String(value)));
    }
    if (Array.isArray(value)) {
        return new Group(...materializeChildren(value));
    }
    if (value instanceof Promise) {
        return materialize(toSignal(value));
    }
    if (isSubscribable(value)) {
        return materialize(toSignal(value));
    }
    if (typeof value === "function") {
        const namespace = getCurrentNamespace();
        const scope = getActiveScope() ?? getRootScope();
        return new DynamicRendered(() => scope.run(() => withNamespace(namespace, () => new ScopedRendered(() => materialize(value())))));
    }
    if (value instanceof RenderedBase) {
        return value;
    }
    if (value instanceof JSXNode) {
        if (value.type === Fragment) {
            return new Group(...(value.props.children == null ? [] : materializeChildren(value.props.children)));
        }
        if (typeof value.type === "string") {
            return materializeElement(value.type, value.props);
        }
        return materializeComponent(value.type, value.props);
    }
    throw new TypeError(`Unsupported Harmless child: ${String(value)}`);
}
