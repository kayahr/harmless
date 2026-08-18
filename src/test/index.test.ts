/*
 * Copyright (C) 2026 Klaus Reimer
 * SPDX-License-Identifier: MIT
 */

import { describe, it } from "node:test";
import { assertAssignable, assertEquals } from "@kayahr/assert";
import * as exports from "../main/index.ts";
import { type ComponentDependencies, type ComponentDependency, component } from "../main/component.ts";
import { Choose, type ChooseProps, Otherwise, type OtherwiseProps, When, type WhenProps } from "../main/components/Choose.ts";
import { For, type ForKey, type ForProps } from "../main/components/For.ts";
import { If, type IfProps } from "../main/components/If.ts";
import {
    A,
    type AProps,
    Route,
    type RouteParameterValues,
    type RouteProps,
    Routes,
    type RoutesProps,
    routeParams
} from "../main/components/Route.tsx";
import {
    type ClassValue,
    type Component,
    type ComponentClass,
    ComponentContext,
    type ComponentContextToken,
    type ComponentFunction,
    type ComponentInstance,
    type IntrinsicProps,
    type JSX,
    type JSXNode,
    type Key,
    type NoProps,
    type ParentProps,
    type Primitive
} from "../main/jsx.ts";
import type { Rendered } from "../main/rendered/Rendered.ts";
import { type RenderedNode, render } from "../main/render.ts";

describe("index", () => {
    it("exports relevant types and functions and nothing more", () => {
        assertEquals({ ...exports }, {
            A,
            Choose,
            ComponentContext,
            For,
            If,
            Otherwise,
            Route,
            Routes,
            When,
            component,
            render,
            routeParams
        });

        assertAssignable<AProps, exports.AProps>();
        assertAssignable<ChooseProps, exports.ChooseProps>();
        assertAssignable<ClassValue, exports.ClassValue>();
        assertAssignable<Component<{ value: number }>, exports.Component<{ value: number }>>();
        assertAssignable<ComponentClass<{ value: number }>, exports.ComponentClass<{ value: number }>>();
        assertAssignable<ComponentDependencies<[ number ]>, exports.ComponentDependencies<[ number ]>>();
        assertAssignable<ComponentDependency<number>, exports.ComponentDependency<number>>();
        assertAssignable<ComponentContext, exports.ComponentContext>();
        assertAssignable<ComponentContextToken, exports.ComponentContextToken>();
        assertAssignable<ComponentFunction<{ value: number }>, exports.ComponentFunction<{ value: number }>>();
        assertAssignable<ComponentInstance, exports.ComponentInstance>();
        assertAssignable<ForKey<{ id: number }>, exports.ForKey<{ id: number }>>();
        assertAssignable<ForProps<{ id: number }>, exports.ForProps<{ id: number }>>();
        assertAssignable<IfProps, exports.IfProps>();
        assertAssignable<IntrinsicProps, exports.IntrinsicProps>();
        assertAssignable<JSX.Element, exports.JSX.Element>();
        assertAssignable<JSXNode<{ value: number }>, exports.JSXNode<{ value: number }>>();
        assertAssignable<Key, exports.Key>();
        assertAssignable<NoProps, exports.NoProps>();
        assertAssignable<OtherwiseProps, exports.OtherwiseProps>();
        assertAssignable<ParentProps, exports.ParentProps>();
        assertAssignable<Primitive, exports.Primitive>();
        assertAssignable<Rendered, exports.Rendered>();
        assertAssignable<RenderedNode, exports.RenderedNode>();
        assertAssignable<RouteParameterValues, exports.RouteParameterValues>();
        assertAssignable<RouteProps, exports.RouteProps>();
        assertAssignable<RoutesProps, exports.RoutesProps>();
        assertAssignable<WhenProps, exports.WhenProps>();
    });
});
