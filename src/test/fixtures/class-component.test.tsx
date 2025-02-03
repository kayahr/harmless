/*
 * Copyright (C) 2024 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { describe, expect, it } from "vitest";

import type { Element } from "../../main/utils/types.js";
import { render } from "./render.js";

describe("fixture", () => {
    describe("class component", () => {
        it("renders correctly", () => {
            class CompA {
                readonly #a: number;
                readonly #b: string;

                public constructor({ a, b }: { a: number, b: string }) {
                    this.#a = a;
                    this.#b = b;
                }

                public render(): Element {
                    return <>
                        <span id="a">{this.#a}</span>
                        <span id="b">{this.#b}</span>
                    </>;
                }
            }

            class CompB {
                readonly #children: unknown;

                public constructor({ children }: { children: unknown }) {
                    this.#children = children;
                }

                public render(): Element {
                    return <div>{this.#children}</div>;
                }
            }

            const root = render(<CompB>
                <span>test</span>
                <CompA a={53} b="test" />
            </CompB>);
            expect(root.innerHTML).toBe('<div><span>test</span><!--<>--><span id="a">53</span><span id="b">test</span><!--</>--></div>');
        });
    });
});
