/*
 * Copyright (C) 2024 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { describe, it } from "node:test";

import type { ComponentClass } from "../main/ClassComponent.ts";
import { Choose, Otherwise, When, type WhenProperties } from "../main/components/Choose.ts";
import { For, type ForProperties } from "../main/components/For.ts";
import { If, type IfProperties } from "../main/components/If.ts";
import { A, type AProperties, Route, type RouteParams, type RouteProperties, Routes } from "../main/components/Route.ts";
import { Show, type ShowProperties } from "../main/components/Show.ts";
import { Context } from "../main/Context.ts";
import * as exports from "../main/index.ts";
import { JSXElement } from "../main/JSXElement.ts";
import { type ComponentOptions, component } from "../main/utils/component.ts";
import { onDestroy } from "../main/utils/lifecycle.ts";
import { Reference, ref } from "../main/utils/Reference.ts";
import { render } from "../main/utils/render.ts";
import type { Element, ElementObject  } from "../main/utils/types.ts";
import { assertEquals } from "@kayahr/assert";

describe("index", () => {
    it("exports relevant types and functions and nothing more", () => {
        // Checks if runtime includes the expected exports and nothing else
        assertEquals({ ...exports }, {
            component,
            JSXElement,
            Show,
            For,
            Route,
            Routes,
            A,
            If,
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
        ((): AProperties => (({} as exports.AProperties)))();
        ((): ComponentClass => (({} as exports.ComponentClass)))();
        ((): ElementObject => (({} as exports.ElementObject)))();
        ((): IfProperties => (({} as exports.IfProperties)))();
        ((): RouteParams => (({} as exports.RouteParams)))();
        ((): RouteProperties => (({} as exports.RouteProperties)))();

        void ((): Element => (({} as exports.Element)))();
        void ((): Element => (({} as exports.JSX.Element)))();
    });
});
