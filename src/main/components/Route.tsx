/*
 * Copyright (C) 2025 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information.
 */

import { Context } from "@kayahr/cdi";
import { Observable } from "@kayahr/observable";
import { ReadonlySignal, signal, toSignal, type WritableSignal } from "@kayahr/signal";

import { getChildRenderings } from "../utils/children.js";
import { escapeRegExp } from "../utils/regexp.js";
import type { Element } from "../utils/types.js";

/** Signal reporting the current path read from location hash. If hash does not start with a slash then a slash is prepended. */
const currentPath = toSignal(new Observable<string>(observer => {
    const getHash = () => {
        const path = window.location.hash.substring(1);
        return path.startsWith("/") ? path : `/${path}`;
    };
    const listener = () => observer.next(getHash());
    observer.next(getHash());
    window.addEventListener("popstate", listener);
    return () => window.removeEventListener("popstate", listener);
}), { requireSync: true });

/**
 * Creates a regular expression pattern to match the given path.
 *
 * @param path - The path to create a pattern for.
 * @returns The created pattern.
 */
function createPathPattern(s: string): RegExp {
    return new RegExp(`^${s.split("/").filter((p, index) => index > 0 || p !== "").map(part => {
        if (part.startsWith(":")) {
            part = part.substring(1);
            const optional = part.endsWith("?");
            const pattern = `\\/(?<${optional ? part.substring(0, part.length - 1) : part}>[^/]*)`;
            return optional ? `(?:${pattern})?` : pattern;
        } else {
            return escapeRegExp("/" + part);
        }
    }).join("")}$`);
}

/** Container for the current route parameters */
const routeParams = signal<Record<string, string>>({});

/**
 * Injectable readonly signal to access current route parameters.
 */
export class RouteParams<T extends Record<string, string> = Record<string, string>> extends ReadonlySignal<T> {
    public constructor() {
        super(routeParams as WritableSignal<T>);
    }
}
Context.getActive().setClass(RouteParams);

/**
 * Checks if given pattern matches the active path.
 *
 * @param pattern - The pattern to check.
 * @returns True if pattern matches current path, false if not.
 */
function isActivePath(pattern: RegExp): boolean {
    const match = pattern.exec(currentPath());
    if (match == null) {
        return false;
    }
    routeParams.set(match.groups ?? {});
    return true;
}

/**
 * Renders the first route which matches the active path.
 */
export function Routes({ children }: { children?: Element }): Element {
    const routes = getChildRenderings(children, Route).map(route => ({ pattern: createPathPattern(route.path), ...route }));
    return <>{() => routes.find(route => isActivePath(route.pattern))?.children}</>;
}

/**
 * Properties for the {@link Route} component.
 */
export type RouteProperties = {
    /** The route path to check. */
    path: string;

    /** The route children to render when route path matches the current path. */
    children?: Element;
};

/**
 * Component which conditionally shows content if given path matches the current path and no previous route in the parent {@link Routes} component matched.
 *
 * @param properties - The component properties.
 */
export function Route({ path: test, children }: RouteProperties): RouteProperties {
    return { path: test, children };
}
