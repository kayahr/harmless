/*
 * Copyright (C) 2026 Klaus Reimer
 * SPDX-License-Identifier: MIT
 */

import "./dom.ts";
import { createSignal } from "@kayahr/signal";
import { describe, it } from "node:test";

describe("intrinsic ref types", () => {
    it("types signal refs according to the concrete intrinsic tag", () => {
        const dummy = () => {
            const [ , setCanvas ] = createSignal<HTMLCanvasElement | null>(null);
            const [ , setDiv ] = createSignal<HTMLDivElement | null>(null);
            const [ , setInput ] = createSignal<HTMLInputElement | null>(null);
            const [ , setSvg ] = createSignal<SVGSVGElement | null>(null);
            const [ , setMath ] = createSignal<MathMLElement | null>(null);
            const [ , setCustom ] = createSignal<HTMLElement | null>(null);

            <canvas ref={setCanvas} />;
            <input ref={setInput} />;
            <svg ref={setSvg} />;
            <math ref={setMath} />;
            <my-widget ref={setCustom} />;

            // @ts-expect-error Canvas refs cannot write canvas elements into a div signal.
            <canvas ref={setDiv} />;
            // @ts-expect-error SVG refs cannot write SVG elements into a canvas signal.
            <svg ref={setCanvas} />;
            // @ts-expect-error Custom element refs cannot write arbitrary HTML elements into a canvas signal.
            <my-widget ref={setCanvas} />;
        };
        void dummy;
    });
});
