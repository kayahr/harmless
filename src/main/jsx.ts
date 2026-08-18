/*
 * Copyright (C) 2026 Klaus Reimer
 * SPDX-License-Identifier: MIT
 */

import type { Subscribable } from "@kayahr/observable";
import type { Setter } from "@kayahr/signal";
import type { Rendered } from "./rendered/Rendered.ts";

/** Primitive child values rendered as text, except nullish values which render nothing. */
export type Primitive = bigint | boolean | null | number | string | undefined;

/** Key type for keyed APIs and normalized `key` props. */
export type Key = bigint | number | string;

/** Props type for components not accepting any own props. */
export type NoProps = Record<string, never>;

/** Props helper adding optional `children`. */
export interface ParentProps {
    /** Nested child content rendered inside the current node. */
    children?: JSX.Element;
}

/** Reactive wrapper accepted recursively by intrinsic props. */
type IntrinsicReactive<T> = T | Promise<IntrinsicReactive<T>> | Subscribable<IntrinsicReactive<T>> | (() => IntrinsicReactive<T>);

/** Primitive-like values accepted by generic attribute fallbacks. */
type IntrinsicAttributeValue = bigint | boolean | null | number | string | undefined;

/** Primitive-like values accepted by ARIA attributes. */
type IntrinsicAriaAttributeValue = bigint | boolean | null | number | string | undefined;

/** String-like values accepted by simple text-valued attributes such as `for`. */
type IntrinsicTextAttributeValue = bigint | false | null | number | string | undefined;

/** Values accepted recursively by the `class` prop. */
export type ClassValue = false | null | Readonly<Record<string, boolean>> | string | undefined | readonly ClassValue[];

/** One inline-style object accepted by the `style` prop. */
type IntrinsicStyleObject = Readonly<Record<string, null | number | string | undefined>>;

/** Values accepted by the `style` prop. */
type IntrinsicStyleValue = false | IntrinsicStyleObject | null | number | string | undefined;

/** Event listener props in Harmless use the `on:*` syntax. */
type IntrinsicEventProps = Partial<Record<`on:${string}`, EventListener>>;

/** Hyphenated attribute names such as `data-*` or `stroke-width`. */
type HyphenatedAttributeName = `${string}-${string}`;

/** ARIA attribute names such as `aria-label` or `aria-hidden`. */
type AriaAttributeName = `aria-${string}`;

/** Supported namespaced attribute names. */
type NamespacedAttributeName = `xlink:${string}` | `xml:${string}`;

/** Additional generic attribute-style keys passed through as plain DOM attributes. */
type IntrinsicAttributeProps = Partial<Record<
    Exclude<HyphenatedAttributeName, AriaAttributeName> | NamespacedAttributeName,
    IntrinsicReactive<IntrinsicAttributeValue>
>>;

/** ARIA attributes accepted by intrinsic elements. */
type IntrinsicAriaAttributeProps = Partial<Record<
    AriaAttributeName,
    IntrinsicReactive<IntrinsicAriaAttributeValue>
>>;

/** Props accepted by every intrinsic element independent of its concrete DOM type. */
export type IntrinsicProps = ParentProps & IntrinsicEventProps & {
    /** Optional normalized JSX key passed through to intrinsic elements like any other prop. */
    key?: Key;
    /** HTML-style class attribute accepting strings, Boolean maps and nested arrays. */
    class?: IntrinsicReactive<ClassValue>;
    /** HTML-style label association attribute. */
    for?: IntrinsicReactive<IntrinsicTextAttributeValue>;
    /** Signal setter receiving the element after creation and null on disposal. */
    ref?: Setter<Element | null>;
    /** Inline styles written either as CSS text or property-by-property. */
    style?: IntrinsicReactive<IntrinsicStyleValue>;
};

type IfEquals<X, Y, Then = X, Else = never> =
    (<T>() => T extends X ? 1 : 2) extends
    (<T>() => T extends Y ? 1 : 2)
        ? Then
        : Else;

/* oxlint-disable typescript/consistent-indexed-object-style */
type WritablePropertyKeys<T> = {
    [K in Extract<keyof T, string>]-?: IfEquals<
        { [Q in K]: T[K] },
        { -readonly [Q in K]: T[K] },
        T[K] extends (...args: never[]) => unknown ? never : K
    >;
}[Extract<keyof T, string>];
/* oxlint-enable typescript/consistent-indexed-object-style */

type IntrinsicElementPropertyKeys<T extends Element> = Exclude<
    WritablePropertyKeys<T>,
    `on${string}` | "children" | "class" | "className" | "for" | "key" | "ref" | "style"
>;

type IntrinsicElementPropertyProps<T extends Element> = {
    [K in IntrinsicElementPropertyKeys<T>]?: IntrinsicReactive<T[K] | null | undefined>;
};

/** HTML intrinsic props typed through the concrete writable DOM properties plus attribute fallbacks. */
type TypedHtmlIntrinsicProps<T extends HTMLElement> =
    Omit<IntrinsicProps, "ref">
    & IntrinsicAttributeProps
    & IntrinsicAriaAttributeProps
    & IntrinsicElementPropertyProps<T>
    & {
        /** Signal setter receiving the element after creation and null on disposal. */
        ref?: Setter<T | null>;
    };

/** SVG and MathML stay broad because those APIs are predominantly attribute-driven in Harmless. */
type TypedMarkupIntrinsicProps<T extends Element> = Omit<IntrinsicProps, "ref"> & Record<string, unknown> & {
    /** Signal setter receiving the element after creation and null on disposal. */
    ref?: Setter<T | null>;
};

type KnownIntrinsicElementTag = keyof HTMLElementTagNameMap | keyof SVGElementTagNameMap | keyof MathMLElementTagNameMap;

/** Typed intrinsic props for all supported standard intrinsic tags. */
type KnownIntrinsicElements = {
    [K in KnownIntrinsicElementTag]:
        K extends keyof HTMLElementTagNameMap ? TypedHtmlIntrinsicProps<HTMLElementTagNameMap[K]>
            : K extends keyof SVGElementTagNameMap ? TypedMarkupIntrinsicProps<SVGElementTagNameMap[K]>
                : K extends keyof MathMLElementTagNameMap ? TypedMarkupIntrinsicProps<MathMLElementTagNameMap[K]>
                    : never;
};

/** Typed intrinsic props fallback for autonomous custom elements. */
type CustomIntrinsicElements = {
    [K in `${string}-${string}` as K extends KnownIntrinsicElementTag ? never : K]: TypedHtmlIntrinsicProps<HTMLElement>;
};

/**
 * Explicit component lifecycle context.
 */
export interface ComponentContext {
    /**
     * Registers cleanup work to run when this component instance is disposed.
     *
     * @param cleanup - The cleanup callback.
     */
    onDispose(cleanup: () => void): void;
}

/**
 * Injection token for requesting the current component lifecycle context.
 *
 * Use this token in `component(...)` metadata when a component wants access to its
 * disposal context as a normal injected dependency.
 */
export const ComponentContext = Symbol("ComponentContext");

/**
 * Type of the special component-context injection token.
 */
export type ComponentContextToken = typeof ComponentContext;

/** Function component signature. */
export type ComponentFunction<P = Record<string, unknown>, I extends unknown[] = []>
    = (props: P, ...injects: I) => JSX.Element;

/**
 * Instance contract implemented by class components.
 */
export interface ComponentInstance {
    /**
     * Renders the component into a Harmless JSX element.
     *
     * @returns The rendered component content.
     */
    render(): JSX.Element;

    /**
     * Optional cleanup hook run when Harmless disposes the component instance.
     */
    [Symbol.dispose]?(): void;
}

/** Class component constructor signature. */
export type ComponentClass<P = Record<string, unknown>, I extends unknown[] = []>
    = new (props: P, ...injects: I) => ComponentInstance;

/**
 * JSX namespace consumed by TypeScript's `react-jsx` transform.
 *
 * @see https://www.typescriptlang.org/docs/handbook/jsx.html
 */
export namespace JSX {
    /** Full value space accepted and returned by Harmless JSX. */
    export type Element = Primitive | Node | Promise<Element> | Rendered | Subscribable<Element> | JSXNode<any> | readonly Element[] | (() => Element);

    /** Component tag expressions are function or class components. */
    export type ElementType = string | Component<any, any>;

    /** Class component instances render themselves into JSX elements. */
    export interface ElementClass extends ComponentInstance {}

    /** Harmless uses the `children` prop name for nested content. */
    export interface ElementChildrenAttribute {
        /** Nested child content rendered inside the current node. */
        children: object;
    }

    /** Intrinsic element props with tag-specific ref types plus custom-element fallback. */
    export type IntrinsicElements = KnownIntrinsicElements & CustomIntrinsicElements;
}

/** Supported component source types. */
export type Component<P = Record<string, unknown>, I extends unknown[] = []> = ComponentClass<P, I> | ComponentFunction<P, I>;

/**
 * JSX fragment component.
 *
 * This exists as the tag target for `<>...</>` and returns its children unchanged.
 */
export function Fragment({ children }: ParentProps): JSX.Element {
    return children ?? null;
}

/** JSX node created by the Harmless runtime. */
export class JSXNode<P extends Record<string, unknown> = Record<string, unknown>> {
    /** Intrinsic tag name or component. */
    public readonly type: string | Component<any, any>;

    /** JSX props passed to the intrinsic tag or component. */
    public readonly props: P;

    /**
     * Creates a new JSX runtime descriptor.
     *
     * @param type  - Intrinsic tag name or component.
     * @param props - JSX props.
     */
    public constructor(type: string | Component<any, any>, props: P) {
        this.type = type;
        this.props = props;
    }
}

/**
 * Creates a Harmless JSX node.
 *
 * @param type  - Intrinsic tag name or component.
 * @param props - JSX props.
 * @param key   - Optional third JSX argument emitted by TypeScript for `key`.
 * @returns The created JSX node descriptor.
 */
export function jsx<P extends Record<string, unknown>>(type: JSXNode<P>["type"], props: P | null, key?: Key): JSXNode<P> {
    const normalizedProps = key === undefined
        ? (props ?? {}) as P
        : {
            ...props,
            key
        } as unknown as P;

    return new JSXNode(type, normalizedProps);
}

/** Alias used by TypeScript for multiple static children. */
export const jsxs = jsx;

/** Alias used by TypeScript's development JSX runtime. */
export const jsxDEV = jsx;

/**
 * Returns whether the given value is a Harmless JSX node descriptor.
 *
 * @param value - The value to check.
 * @returns True when the value is a JSX node descriptor.
 */
export function isJSXNode(value: unknown): value is JSXNode {
    return value instanceof JSXNode;
}
