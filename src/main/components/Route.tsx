/*
 * Copyright (C) 2026 Klaus Reimer
 * SPDX-License-Identifier: MIT
 */

import { type Getter, type Setter, batch, createEffect, createSignal } from "@kayahr/signal";
import { type ComponentContext, type JSX, JSXNode, type ParentProps } from "../jsx.ts";

/** Route parameter values captured from the active path. */
export type RouteParameterValues = Record<string, string | undefined>;

const [ getRouteParams, setRouteParams ] = createSignal<RouteParameterValues>({});

/**
 * Returns the parameters captured from the globally active route.
 *
 * @returns The current route parameters.
 */
export function routeParams(): RouteParameterValues {
    return getRouteParams();
}

/** Props accepted by {@link Routes}. */
export type RoutesProps = ParentProps;

/** Props accepted by {@link Route}. */
export interface RouteProps extends ParentProps {
    /** Exact route path with optional `:name` and `:name?` parameter segments. */
    path: string;
}

/** Props accepted by {@link A}. */
export interface AProps extends ParentProps {
    /** Hash route path to link to. */
    href: string;

    /** CSS class used while the link path is active. */
    activeClass?: string;

    /** CSS class used while the link path is inactive. */
    inactiveClass?: string;
}

/** Compiled route path pattern. */
interface PathPattern {
    /** Exact regular expression matching the complete normalized path. */
    readonly expression: RegExp;

    /** Parameter names in capture-group order. */
    readonly parameterNames: readonly string[];
}

/** One compiled route marker. */
interface RouteEntry {
    /** Original route props. */
    readonly props: RouteProps;

    /** Compiled path pattern. */
    readonly pattern: PathPattern;
}

/** Result of matching one route. */
interface RouteMatch {
    /** Matched route entry. */
    readonly route: RouteEntry;

    /** Decoded parameters captured from the path. */
    readonly params: RouteParameterValues;
}

/** Shared reactive browser hash-route path. */
interface CurrentPathState {
    /** Reads the current normalized path. */
    readonly get: Getter<string>;

    /** Updates the current normalized path. */
    readonly set: Setter<string>;

    /** Synchronizes the signal after browser hash navigation. */
    readonly listener: () => void;

    /** Number of mounted routing components using this state. */
    subscribers: number;
}

let currentPathState: CurrentPathState | null = null;

/**
 * Normalizes a route path to a leading slash.
 *
 * @param path - The path to normalize.
 * @returns The normalized path.
 */
function normalizePath(path: string): string {
    return path.startsWith("/") ? path : `/${path}`;
}

/**
 * Reads and normalizes the current hash route path.
 *
 * @returns The current route path.
 */
function readCurrentPath(): string {
    return normalizePath(globalThis.window.location.hash.slice(1));
}

/**
 * Escapes text for use as a regular-expression literal.
 *
 * @param value - The text to escape.
 * @returns The escaped text.
 */
function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Compiles an exact route path pattern.
 *
 * @param path - The route path to compile.
 * @returns The compiled pattern.
 */
function createPathPattern(path: string): PathPattern {
    const parameterNames: string[] = [];
    const source = normalizePath(path).split("/").slice(1).map(segment => {
        if (!segment.startsWith(":")) {
            return `/${escapeRegExp(segment)}`;
        }
        const optional = segment.endsWith("?");
        const name = segment.slice(1, optional ? -1 : undefined);
        if (name.length === 0) {
            throw new TypeError("Route parameter name must not be empty");
        }
        if (parameterNames.includes(name)) {
            throw new TypeError(`Duplicate route parameter: ${name}`);
        }
        parameterNames.push(name);
        return optional ? "(?:/([^/]+))?" : "/([^/]+)";
    }).join("");
    return {
        expression: new RegExp(`^${source}$`),
        parameterNames
    };
}

/**
 * Matches a normalized path and decodes its parameters.
 *
 * @param pattern - The compiled pattern.
 * @param path    - The normalized path to match.
 * @returns The captured parameters, or null when the path does not match.
 */
function matchPath(pattern: PathPattern, path: string): RouteParameterValues | null {
    const match = pattern.expression.exec(path);
    if (match == null) {
        return null;
    }
    const params: Record<string, string> = {};
    for (let index = 0; index < pattern.parameterNames.length; index++) {
        const value = match[index + 1];
        if (value != null) {
            params[pattern.parameterNames[index]] = decodeURIComponent(value);
        }
    }
    return params;
}

/**
 * Finds the first route matching the current path.
 *
 * @param routes - The routes to search in declaration order.
 * @param path   - The normalized current path.
 * @returns The first route match, or null when no route matches.
 */
function findRoute(routes: readonly RouteEntry[], path: string): RouteMatch | null {
    for (const route of routes) {
        const params = matchPath(route.pattern, path);
        if (params != null) {
            return { route, params };
        }
    }
    return null;
}

/**
 * Uses the shared browser hash path for one mounted routing component.
 *
 * @param context - The owning component context.
 * @returns The reactive current path getter.
 */
function useCurrentPath(context: ComponentContext): Getter<string> {
    let state = currentPathState;
    if (state == null) {
        const [ get, set ] = createSignal(readCurrentPath());
        state = currentPathState = {
            get,
            set,
            listener: () => set(readCurrentPath()),
            subscribers: 0
        };
    }
    if (state.subscribers === 0) {
        state.set(readCurrentPath());
        globalThis.window.addEventListener("hashchange", state.listener);
    }
    state.subscribers++;
    context.onDispose(() => {
        state.subscribers--;
        if (state.subscribers === 0) {
            globalThis.window.removeEventListener("hashchange", state.listener);
        }
    });
    return state.get;
}

/**
 * Renders the first {@link Route} child matching the current hash path.
 *
 * @param props   - The component props.
 * @param context - The owning component context.
 * @returns The selected route branch.
 */
export function Routes({ children }: RoutesProps, context: ComponentContext): JSX.Element {
    const entries: readonly JSX.Element[] = Array.isArray(children) ? children : [ children ];
    const routes: RouteEntry[] = [];
    for (const entry of entries) {
        if (entry instanceof JSXNode && entry.type === Route) {
            const props = entry.props as unknown as RouteProps;
            routes.push({ props, pattern: createPathPattern(props.path) });
        }
    }

    const currentPath = useCurrentPath(context);
    const [ getRoute, setRoute ] = createSignal<RouteEntry | null>(null);

    createEffect(() => {
        const match = findRoute(routes, currentPath());
        batch(() => {
            setRoute(match?.route ?? null);
            setRouteParams(match?.params ?? {});
        });
    });

    return () => getRoute()?.props.children ?? null;
}

/**
 * Declares one path branch for a parent {@link Routes} component.
 *
 * @param props - The component props.
 * @returns The route children when rendered directly.
 */
export function Route({ children = null }: RouteProps): JSX.Element {
    return children;
}

/**
 * Renders an anchor targeting a hash route and applies active or inactive CSS classes.
 *
 * @param props   - The component props.
 * @param context - The owning component context.
 * @returns The rendered anchor.
 */
export function A({ href, activeClass, inactiveClass, children = null }: AProps, context: ComponentContext): JSX.Element {
    const pattern = createPathPattern(href);
    const currentPath = useCurrentPath(context);
    return <a href={`#${href}`} class={() => matchPath(pattern, currentPath()) == null ? inactiveClass : activeClass}>{children}</a>;
}
