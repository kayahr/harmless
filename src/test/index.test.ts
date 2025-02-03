/*
 * Copyright (C) 2024 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { describe, expect, it } from "vitest";

import { type ComponentClass } from "../main/ClassComponent.js";
import { Choose, Otherwise, When, type WhenProperties } from "../main/components/Choose.js";
import { For, type ForProperties } from "../main/components/For.js";
import { Show, type ShowProperties } from "../main/components/Show.js";
import { Context } from "../main/Context.js";
import * as exports from "../main/index.js";
import { JSXElement } from "../main/JSXElement.js";
import { component, type ComponentOptions } from "../main/utils/component.js";
import { onDestroy } from "../main/utils/lifecycle.js";
import { ref, Reference } from "../main/utils/Reference.js";
import { render } from "../main/utils/render.js";
import { type Element, type ElementObject  } from "../main/utils/types.js";

describe("index", () => {
    it("exports relevant types and functions and nothing more", () => {
        // Checks if runtime includes the expected exports and nothing else
        expect({ ...exports }).toEqual({
            component,
            JSXElement,
            Show,
            For,
            onDestroy,
            ref,
            Context,
            Reference,
            render,
            When,
            Choose,
            Otherwise
        });

        // Interfaces and types can only be checked by TypeScript
        ((): ShowProperties => (({} as exports.ShowProperties)))();
        ((): ForProperties => (({} as exports.ForProperties)))();
        ((): ComponentOptions => (({} as exports.ComponentOptions)))();
        ((): WhenProperties => (({} as exports.WhenProperties)))();
        ((): ComponentClass => (({} as exports.ComponentClass)))();
        ((): ElementObject => (({} as exports.ElementObject)))();
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        ((): Element => (({} as exports.Element)))();
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        ((): Element => (({} as exports.JSX.Element)))();
    });
});
