/*
 * Copyright (C) 2024 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { describe, expect, it } from "vitest";

import { render } from "./render.js";

describe("fixture", () => {
    describe("function component", () => {
        it("renders correctly", () => {
            const CompA = ({ a, b }: { a: number, b: string }) => {
                return <>
                    <span id="a">{a}</span>
                    <span id="b">{b}</span>
                </>;
            };

            const CompB = ({ children }: { children: unknown }) => <div>{children}</div>;

            const root = render(<CompB>
                <span>test</span>
                <CompA a={53} b="test" />
            </CompB>);
            expect(root.innerHTML).toBe('<div><span>test</span><!--<>--><span id="a">53</span><span id="b">test</span><!--</>--></div>');
        });
    });
});
