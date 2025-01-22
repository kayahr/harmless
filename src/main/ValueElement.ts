import { JSXElement } from "./JSXElement.js";
import type { Element } from "./utils/types.js";

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
