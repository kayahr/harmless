/*
 * Copyright (C) 2026 Klaus Reimer
 * SPDX-License-Identifier: MIT
 */

import "./dom.ts";
import { describe, it } from "node:test";
import { assertInstanceOf, assertSame } from "@kayahr/assert";
import { render } from "../main/render.ts";

describe("key normalization", () => {
    it("passes key to components as a normal prop", () => {
        function Receiver(props: { key: number; value: string }) {
            return <div>{props.value}:{props.key}</div>;
        }

        const node = render(<Receiver key={123} value="test" />);

        assertInstanceOf(node, HTMLDivElement);
        assertSame(node.textContent, "test:123");
    });

    it("passes key to intrinsic elements as a normal prop", () => {
        const node = render(<div key="foo">bar</div>);

        assertInstanceOf(node, HTMLDivElement);
        assertSame(node.textContent, "bar");
        assertSame(node.getAttribute("key"), "foo");
    });
});
