/*
 * Copyright (C) 2026 Klaus Reimer
 * SPDX-License-Identifier: MIT
 */

import "../dom.ts";
import { dispose } from "@kayahr/scope";
import { describe, it } from "node:test";
import { assertInstanceOf, assertSame, assertThrowWithMessage } from "@kayahr/assert";
import { A, Route, Routes, routeParams } from "../../main/components/Route.tsx";
import type { ComponentContext, NoProps } from "../../main/jsx.ts";
import { render } from "../../main/render.ts";

/**
 * Navigates to a hash route and waits for the browser hashchange task.
 *
 * @param hash - The destination hash.
 */
async function navigate(hash: string): Promise<void> {
    location.hash = hash;
    await new Promise(resolve => setTimeout(resolve, 0));
}

describe("Routes", () => {
    it("renders the first matching direct Route child and normalizes a hash without slash", async () => {
        await navigate("#b");
        const node = render(
            <div>
                <Routes>
                    ignored text
                    <span>ignored element</span>
                    <Route path="/">Root</Route>
                    <Route path="/b">B</Route>
                    <Route path="/b">B2</Route>
                </Routes>
            </div>
        );

        assertInstanceOf(node, HTMLDivElement);
        assertSame(node.textContent, "B");
        dispose(node);
    });

    it("renders an empty branch with no routes or no matching route", async () => {
        await navigate("#/missing");
        const emptyRoutes = render(<Routes />);

        assertSame(emptyRoutes.textContent, "");
        dispose(emptyRoutes);

        const node = render(<Routes><Route path="/other">Other</Route></Routes>);

        assertSame(node.textContent, "");
        dispose(node);
    });

    it("updates decoded required and optional parameters without remounting the same route", async () => {
        await navigate("#/users/Arthur%20Dent");
        let createdUsers = 0;
        let disposedUsers = 0;
        let createdOther = 0;
        let disposedOther = 0;

        function User(props: NoProps, context: ComponentContext) {
            createdUsers++;
            context.onDispose(() => {
                disposedUsers++;
            });
            return <span>{() => `${routeParams().id}:${routeParams().tab ?? "-"}`}</span>;
        }

        function Other(props: NoProps, context: ComponentContext) {
            createdOther++;
            context.onDispose(() => {
                disposedOther++;
            });
            return <span>Other</span>;
        }

        const node = render(
            <div>
                <Routes>
                    <Route path="/users/:id/:tab?"><User /></Route>
                    <Route path="/other"><Other /></Route>
                </Routes>
            </div>
        );

        assertSame(node.textContent, "Arthur Dent:-");
        assertSame(createdUsers, 1);
        assertSame(disposedUsers, 0);

        await navigate("#/users/Ford/settings");
        assertSame(node.textContent, "Ford:settings");
        assertSame(createdUsers, 1);
        assertSame(disposedUsers, 0);

        await navigate("#/other");
        assertSame(node.textContent, "Other");
        assertSame(createdUsers, 1);
        assertSame(disposedUsers, 1);
        assertSame(createdOther, 1);
        assertSame(disposedOther, 0);

        await navigate("#/users/Alice");
        assertSame(node.textContent, "Alice:-");
        assertSame(createdUsers, 2);
        assertSame(disposedUsers, 1);
        assertSame(createdOther, 1);
        assertSame(disposedOther, 1);

        dispose(node);
        assertSame(disposedUsers, 2);
        assertSame(disposedOther, 1);
    });

    it("does not match an empty required parameter", async () => {
        await navigate("#/users/");
        const node = render(
            <div>
                <Routes>
                    <Route path="/users/:id">User</Route>
                    <Route path="/users/">Users</Route>
                </Routes>
            </div>
        );

        assertSame(node.textContent, "Users");
        dispose(node);
    });

    it("matches regular-expression characters in literal path segments literally", async () => {
        await navigate("#/docs/a+b.html");
        const node = render(
            <div>
                <Routes>
                    <Route path="/docs/a+b.html">Docs</Route>
                </Routes>
            </div>
        );

        assertSame(node.textContent, "Docs");
        dispose(node);
    });

    it("rejects empty and duplicate route parameter names", () => {
        assertThrowWithMessage(
            () => render(<Routes><Route path="/:">Invalid</Route></Routes>),
            TypeError,
            "Route parameter name must not be empty"
        );
        assertThrowWithMessage(
            () => render(<Routes><Route path="/:id/:id">Invalid</Route></Routes>),
            TypeError,
            "Duplicate route parameter: id"
        );
    });

    it("renders active route links without changing route parameters", async () => {
        await navigate("#/users/42");

        function User(props: NoProps) {
            return <span>{() => routeParams().id}</span>;
        }

        const node = render(
            <div>
                <Routes>
                    <Route path="/users/:id"><User /></Route>
                </Routes>
                <A href="/users/42" activeClass="active" inactiveClass="inactive">User 42</A>
                <A href="/other" activeClass="active" inactiveClass="inactive">Other</A>
                <A href="/plain">Plain</A>
            </div>
        );
        assertInstanceOf(node, HTMLDivElement);
        const root = node as HTMLDivElement;
        const links = root.querySelectorAll("a");

        assertSame(root.querySelector("span")?.textContent, "42");
        assertSame(links[0].getAttribute("href"), "#/users/42");
        assertSame(links[0].className, "active");
        assertSame(links[1].className, "inactive");
        assertSame(links[2].hasAttribute("class"), false);

        await navigate("#/other");
        assertSame(links[0].className, "inactive");
        assertSame(links[1].className, "active");
        assertSame(links[2].hasAttribute("class"), false);

        dispose(node);

        await navigate("#/plain");
        const remountedLink = render(<A href="/plain" activeClass="active">Plain</A>);
        assertInstanceOf(remountedLink, HTMLAnchorElement);
        assertSame(remountedLink.className, "active");
        dispose(remountedLink);
    });

    it("returns marker children when called directly", () => {
        assertSame(Route({ path: "/", children: "Root" }), "Root");
        assertSame(Route({ path: "/" }), null);
    });
});
