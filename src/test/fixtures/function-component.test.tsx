/*
 * Copyright (C) 2024 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { describe, it } from "node:test";

import { render } from "./render.ts";
import { assertSame } from "@kayahr/assert";

describe("fixture", () => {
    describe("function component", () => {
        it("renders correctly", () => {
            const CompA = ({ a, b }: { a: number, b: string }) => <>
                <span id="a">{a}</span>
                <span id="b">{b}</span>
            </>;

            const CompB = ({ children }: { children: unknown }) => <div>{children}</div>;

            const root = render(<CompB>
                <span>test</span>
                <CompA a={53} b="test" />
            </CompB>);
            assertSame(root.innerHTML, '<div><span>test</span><!--<>--><span id="a">53</span><span id="b">test</span><!--</>--></div>');
        });
    });
});
