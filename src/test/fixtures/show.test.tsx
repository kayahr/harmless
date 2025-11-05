/*
 * Copyright (C) 2024 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { signal } from "@kayahr/signal";
import { describe, it } from "node:test";

import { Show } from "../../main/components/Show.ts";
import { onDestroy } from "../../main/utils/lifecycle.ts";
import { render } from "./render.ts";
import { assertSame } from "@kayahr/assert";

describe("fixture", () => {
    describe("show", () => {
        it("renders children when condition is true", () => {
            const root = render(<Show when={() => true}>Shown</Show>);
            assertSame(root.innerHTML, "<!--<>-->Shown<!--</>-->");
        });
        it("renders nothing when condition is false and no fallback is given", () => {
            const root = render(<Show when={() => false}>Shown</Show>);
            assertSame(root.innerHTML, "<!--<>--><!--</>-->");
        });
        it("renders fallback when condition is false", () => {
            const root = render(<Show when={() => false} fallback={<span>Hidden</span>}>Shown</Show>);
            assertSame(root.innerHTML, "<!--<>--><span>Hidden</span><!--</>-->");
        });
        it("dynamically toggles content when condition result changes", () => {
            const visible = signal(false);
            const root = render(<Show when={visible}>Shown</Show>);
            assertSame(root.innerHTML, "<!--<>--><!--</>-->");
            visible.set(true);
            assertSame(root.innerHTML, "<!--<>-->Shown<!--</>-->");
            visible.set(false);
            assertSame(root.innerHTML, "<!--<>--><!--</>-->");
            visible.set(true);
            assertSame(root.innerHTML, "<!--<>-->Shown<!--</>-->");
        });
        it("dynamically switches between children and fallback when condition result changes", () => {
            const visible = signal(true);
            const root = render(<Show when={visible} fallback="Hidden">Shown</Show>);
            assertSame(root.innerHTML, "<!--<>-->Shown<!--</>-->");
            visible.set(false);
            assertSame(root.innerHTML, "<!--<>-->Hidden<!--</>-->");
            visible.set(true);
            assertSame(root.innerHTML, "<!--<>-->Shown<!--</>-->");
            visible.set(false);
            assertSame(root.innerHTML, "<!--<>-->Hidden<!--</>-->");
        });
        it("correctly destroys the component which is not active", () => {
            const visible = signal(false);
            let compAActive = false;
            let compBActive = false;
            const CompA = () => {
                compAActive = true;
                onDestroy(() => compAActive = false);
                return <span>CompA</span>;
            };
            const CompB = () => {
                compBActive = true;
                onDestroy(() => compBActive = false);
                return <span>CompB</span>;
            };
            const root = render(<Show when={visible} fallback={<CompB />}><CompA /></Show>);
            assertSame(root.innerHTML, "<!--<>--><span>CompB</span><!--</>-->");
            assertSame(compAActive, false);
            assertSame(compBActive, true);

            visible.set(true);
            assertSame(root.innerHTML, "<!--<>--><span>CompA</span><!--</>-->");
            assertSame(compAActive, true);
            assertSame(compBActive, false);
        });
        it("correctly destroys the component (returning a fragment) which is not active", () => {
            const visible = signal(false);
            let compAActive = false;
            let compBActive = false;
            const CompA = () => {
                compAActive = true;
                onDestroy(() => compAActive = false);
                return <>CompA</>;
            };
            const CompB = () => {
                compBActive = true;
                onDestroy(() => compBActive = false);
                return <>CompB</>;
            };
            const root = render(<Show when={visible} fallback={<CompB />}><CompA /></Show>);
            assertSame(root.innerHTML, "<!--<>--><!--<>-->CompB<!--</>--><!--</>-->");
            assertSame(compAActive, false);
            assertSame(compBActive, true);

            visible.set(true);
            assertSame(root.innerHTML, "<!--<>--><!--<>-->CompA<!--</>--><!--</>-->");
            assertSame(compAActive, true);
            assertSame(compBActive, false);
        });
        it("correctly destroys the component (within a fragment) which is not active", () => {
            const visible = signal(false);
            let compAActive = false;
            let compBActive = false;
            const CompA = () => {
                compAActive = true;
                onDestroy(() => compAActive = false);
                return <span>CompA</span>;
            };
            const CompB = () => {
                compBActive = true;
                onDestroy(() => compBActive = false);
                return <span>CompB</span>;
            };
            const root = render(<Show when={visible} fallback={<><CompB /></>}><><CompA /></></Show>);
            assertSame(root.innerHTML, "<!--<>--><!--<>--><span>CompB</span><!--</>--><!--</>-->");
            assertSame(compAActive, false);
            assertSame(compBActive, true);

            visible.set(true);
            assertSame(root.innerHTML, "<!--<>--><!--<>--><span>CompA</span><!--</>--><!--</>-->");
            assertSame(compAActive, true);
            assertSame(compBActive, false);
        });
    });
});
