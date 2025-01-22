/*
 * Copyright (C) 2024 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { signal } from "@kayahr/signal";
import { describe, expect, it } from "vitest";

import { Show } from "../../main/components/Show.js";
import { onDestroy } from "../../main/utils/lifecycle.js";
import { render } from "./render.js";

describe("fixture", () => {
    describe("show", () => {
        it("renders children when condition is true", () => {
            const root = render(<Show when={() => true}>Shown</Show>);
            expect(root.innerHTML).toBe("Shown");
        });
        it("renders nothing when condition is false and no fallback is given", () => {
            const root = render(<Show when={() => false}>Shown</Show>);
            expect(root.innerHTML).toBe("");
        });
        it("renders fallback when condition is false", () => {
            const root = render(<Show when={() => false} fallback={<span>Hidden</span>}>Shown</Show>);
            expect(root.innerHTML).toBe("<span>Hidden</span>");
        });
        it("dynamically toggles content when condition result changes", () => {
            const visible = signal(false);
            const root = render(<Show when={visible}>Shown</Show>);
            expect(root.innerHTML).toBe("");
            visible.set(true);
            expect(root.innerHTML).toBe("Shown");
            visible.set(false);
            expect(root.innerHTML).toBe("");
            visible.set(true);
            expect(root.innerHTML).toBe("Shown");
        });
        it("dynamically switches between children and fallback when condition result changes", () => {
            const visible = signal(true);
            const root = render(<Show when={visible} fallback="Hidden">Shown</Show>);
            expect(root.innerHTML).toBe("Shown");
            visible.set(false);
            expect(root.innerHTML).toBe("Hidden");
            visible.set(true);
            expect(root.innerHTML).toBe("Shown");
            visible.set(false);
            expect(root.innerHTML).toBe("Hidden");
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
            expect(root.innerHTML).toBe("<span>CompB</span>");
            expect(compAActive).toBe(false);
            expect(compBActive).toBe(true);

            visible.set(true);
            expect(root.innerHTML).toBe("<span>CompA</span>");
            expect(compAActive).toBe(true);
            expect(compBActive).toBe(false);
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
            expect(root.innerHTML).toBe("CompB");
            expect(compAActive).toBe(false);
            expect(compBActive).toBe(true);

            visible.set(true);
            expect(root.innerHTML).toBe("CompA");
            expect(compAActive).toBe(true);
            expect(compBActive).toBe(false);
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
            expect(root.innerHTML).toBe("<span>CompB</span>");
            expect(compAActive).toBe(false);
            expect(compBActive).toBe(true);

            visible.set(true);
            expect(root.innerHTML).toBe("<span>CompA</span>");
            expect(compAActive).toBe(true);
            expect(compBActive).toBe(false);
        });
    });
});
