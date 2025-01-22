/*
 * Copyright (C) 2024 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information.
 */

import type { ComponentConstructor } from "./ClassComponent.js";
import type { ComponentFunction } from "./FunctionComponent.js";
import { JSXElement } from "./JSXElement.js";
import type { Element, Properties } from "./utils/types.js";

export type ComponentSource<P extends Properties = Properties, R extends Element = Element> = ComponentConstructor<P, R> | ComponentFunction<P, R>;

/**
 * Base class for JSX elements.
 */
export abstract class Component<T extends ComponentSource<P, R>, P extends Properties = Properties, R extends Element = Element> extends JSXElement<R> {
    protected source: T;

    public constructor(source: T) {
        super();
        this.source = source;
    }

    public getSource(): T {
        return this.source;
    }
}
