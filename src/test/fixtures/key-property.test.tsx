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
                readonly #key: string;

                public constructor({ a, key }: { a: number, key: string }) {
                    this.#a = a;
                    this.#key = key;
                }

                public render(): Element {
                    return <>
                        <span id="a">{this.#a}</span>
                        <span id="key">{this.#key}</span>
                    </>;
                }
            }

            const CompB = ({ a, key }: { a: number, key: string }) => {
                return <>
                    <div id="a">{a}</div>
                    <div id="key">{key}</div>
                </>;
            };

            const root = render(<>
                <CompA a={1} key="key1" />
                <CompB a={2} key="key2" />
            </>);
            expect(root.innerHTML).toBe('<span id="a">1</span><span id="key">key1</span><div id="a">2</div><div id="key">key2</div>');
        });
    });
});
