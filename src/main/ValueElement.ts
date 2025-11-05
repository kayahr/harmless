import { JSXElement } from "./JSXElement.ts";
import type { Element } from "./utils/types.ts";

export class ValueElement extends JSXElement {
    readonly #value: Element;

    public constructor(value: Element) {
        super();
        this.#value = value;
    }

    protected override doRender(): Element {
        return this.#value;
    }
}
