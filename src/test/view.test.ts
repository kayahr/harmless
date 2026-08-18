/*
 * Copyright (C) 2026 Klaus Reimer
 * SPDX-License-Identifier: MIT
 */

import "./dom.ts";
import { describe, it } from "node:test";
import { assertInstanceOf, assertSame, assertThrowWithMessage } from "@kayahr/assert";
import { createEffect, createSignal } from "@kayahr/signal";
import { materialize } from "../main/runtime.ts";
import { DynamicRendered } from "../main/rendered/DynamicRendered.ts";
import { Group } from "../main/rendered/Group.ts";
import { NodeRendered } from "../main/rendered/NodeRendered.ts";
import { Rendered } from "../main/rendered/Rendered.ts";
import { RenderedBase } from "../main/rendered/RenderedBase.ts";
import { ScopedRendered } from "../main/rendered/ScopedRendered.ts";

describe("internal rendered", () => {
    it("appends when the before child is unknown and ignores removing unknown children", () => {
        const view = new Group();
        const a = materialize("A");
        const b = materialize("B");
        const missing = materialize("X");
        const host = document.createElement("div");

        view.appendChild(a);
        view.insertChildBefore(b, missing);
        view.removeChild(missing);
        view.insert(host, null);

        assertSame(host.textContent, "AB");
        assertSame(view.getFirstNode()?.parentNode, host);
        assertSame(view.getLastNode()?.parentNode, host);
    });

    it("ignores self-insertion requests for existing children", () => {
        const view = new Group();
        const child = materialize("A");
        const host = document.createElement("div");

        view.appendChild(child);
        view.insert(host, null);
        view.insertChildBefore(child, child);

        assertSame(host.textContent, "A");
    });

    it("appends when inserting before a foreign view", () => {
        const view = new Group(materialize("A"));
        const foreign = new Group(materialize("X"));
        const host = document.createElement("div");
        const tail = document.createElement("span");
        tail.textContent = "tail";

        view.insert(host, null);
        host.appendChild(tail);
        view.insertChildBefore(materialize("B"), foreign);

        assertSame(host.textContent, "ABtail");
    });

    it("does not retain failed child inserts in the internal child list", () => {
        const view = new Group();
        const badChild = new NodeRendered(document.createTextNode("X"));
        const goodChild = materialize("A");
        const host = document.createElement("div");

        badChild.dispose();

        assertThrowWithMessage(() => view.appendChild(badChild), Error, "Cannot use a disposed rendered output");

        view.appendChild(goodChild);
        view.insert(host, null);

        assertSame(host.textContent, "A");
    });

    it("reports whether a group is inserted", () => {
        const view = new Group();
        const host = document.createElement("div");

        assertSame(view.isInserted(), false);

        view.insert(host, null);

        assertSame(view.isInserted(), true);
    });

    it("destroys detached children when removing them before insertion", () => {
        const text = document.createTextNode("A");
        const child = new NodeRendered(text);
        const view = new Group(child);

        assertInstanceOf(text.parentNode, DocumentFragment);

        view.removeChild(child);

        assertSame(text.parentNode, null);
    });

    it("aggregates child cleanup errors during group disposal", () => {
        const view = new Group(
            new NodeRendered(document.createTextNode("A"), () => {
                throw new Error("a");
            }),
            new NodeRendered(document.createTextNode("B"), () => {
                throw new Error("b");
            })
        );

        let thrown: unknown = null;
        try {
            view.dispose();
        } catch (error) {
            thrown = error;
        }

        assertInstanceOf(thrown, AggregateError);
        assertSame(thrown.errors.length, 2);
        assertSame(thrown.errors[0] instanceof Error ? thrown.errors[0].message : String(thrown.errors[0]), "a");
        assertSame(thrown.errors[1] instanceof Error ? thrown.errors[1].message : String(thrown.errors[1]), "b");
    });

    it("throws a single child cleanup error during group disposal directly", () => {
        const view = new Group(new NodeRendered(document.createTextNode("A"), () => {
            throw new Error("single dispose");
        }));

        assertThrowWithMessage(() => view.dispose(), Error, "single dispose");
    });

    it("throws a single child destroy error during group destruction directly", () => {
        const view = new Group(new NodeRendered(document.createTextNode("A"), () => {
            throw new Error("single destroy");
        }));

        assertThrowWithMessage(() => view.destroy(), Error, "single destroy");
    });

    it("flattens aggregate child destroy errors during group destruction", () => {
        const view = new Group(new NodeRendered(document.createTextNode("A"), () => {
            throw new AggregateError([ new Error("a"), new Error("b") ], "child aggregate");
        }));

        let thrown: unknown = null;
        try {
            view.destroy();
        } catch (error) {
            thrown = error;
        }

        assertInstanceOf(thrown, AggregateError);
        assertSame(thrown.errors.length, 2);
        assertSame(thrown.errors[0] instanceof Error ? thrown.errors[0].message : String(thrown.errors[0]), "a");
        assertSame(thrown.errors[1] instanceof Error ? thrown.errors[1].message : String(thrown.errors[1]), "b");
    });

    it("moves anchors back into the private fragment during group destruction", () => {
        const view = new Group();
        const host = document.createElement("div");

        view.insert(host, null);
        view.destroy();

        assertSame(host.textContent, "");
        assertInstanceOf(view.getFirstNode()?.parentNode, DocumentFragment);
        assertInstanceOf(view.getLastNode()?.parentNode, DocumentFragment);
    });

    it("surfaces errors when moving anchors back into the private fragment fails", () => {
        const view = new Group();
        const host = document.createElement("div");
        const append = DocumentFragment.prototype.append;

        view.insert(host, null);
        DocumentFragment.prototype.append = function (...args: Parameters<typeof append>): void {
            DocumentFragment.prototype.append = append;
            throw new Error(`fragment append:${args.length}`);
        };

        try {
            assertThrowWithMessage(() => view.destroy(), Error, "fragment append:2");
        } finally {
            DocumentFragment.prototype.append = append;
        }
    });

    it("still disposes a scoped signal scope when child disposal throws", () => {
        const [ value, setValue ] = createSignal(0);
        let runs = 0;
        const view = new ScopedRendered(() => {
            createEffect(() => {
                value();
                runs++;
            });
            return new NodeRendered(document.createTextNode("A"), () => {
                throw new Error("child cleanup");
            });
        });
        const host = document.createElement("div");

        view.insert(host, null);
        assertSame(runs, 1);
        assertThrowWithMessage(() => view.dispose(), Error, "child cleanup");
        assertSame(host.textContent, "A");

        setValue(1);
        assertSame(runs, 1);

        view.destroy();
        assertSame(host.textContent, "");
    });

    it("aggregates child and scope cleanup errors in scoped views", () => {
        const [ value, setValue ] = createSignal(0);
        let runs = 0;
        const view = new ScopedRendered(() => {
            createEffect(({ onCleanup }) => {
                value();
                runs++;
                onCleanup(() => {
                    throw new Error("scope cleanup");
                });
            });
            return new NodeRendered(document.createTextNode("A"), () => {
                throw new Error("child cleanup");
            });
        });

        assertSame(runs, 1);

        let thrown: unknown = null;
        try {
            view.dispose();
        } catch (error) {
            thrown = error;
        }

        assertInstanceOf(thrown, AggregateError);
        assertSame(thrown.errors.length, 2);
        assertSame(thrown.errors[0] instanceof Error ? thrown.errors[0].message : String(thrown.errors[0]), "child cleanup");
        assertSame(thrown.errors[1] instanceof Error ? thrown.errors[1].message : String(thrown.errors[1]), "scope cleanup");

        setValue(1);
        assertSame(runs, 1);
    });

    it("disposes scoped rendered outputs cleanly without errors", () => {
        const [ value, setValue ] = createSignal(0);
        let runs = 0;
        let childCleanups = 0;
        let scopeCleanups = 0;
        const view = new ScopedRendered(() => {
            createEffect(({ onCleanup }) => {
                value();
                runs++;
                onCleanup(() => {
                    scopeCleanups++;
                });
            });
            return new NodeRendered(document.createTextNode("A"), () => {
                childCleanups++;
            });
        });
        const host = document.createElement("div");

        view.insert(host, null);
        assertSame(runs, 1);
        view.dispose();
        view.dispose();

        assertSame(host.textContent, "A");
        assertSame(childCleanups, 1);
        assertSame(scopeCleanups, 1);

        setValue(1);
        assertSame(runs, 1);
    });

    it("inserts scoped rendered outputs through an already initialized inner output", () => {
        const view = new ScopedRendered(() => new NodeRendered(document.createTextNode("A")));
        const host = document.createElement("div");

        view.insert(host, null);

        assertSame(host.textContent, "A");
    });

    it("still disposes a scoped signal scope when child destruction throws", () => {
        const [ value, setValue ] = createSignal(0);
        let runs = 0;
        const view = new ScopedRendered(() => {
            createEffect(() => {
                value();
                runs++;
            });
            return new NodeRendered(document.createTextNode("A"), () => {
                throw new Error("child cleanup");
            });
        });

        assertSame(runs, 1);
        assertThrowWithMessage(() => view.destroy(), Error, "child cleanup");

        setValue(1);
        assertSame(runs, 1);
    });

    it("aggregates child and scope cleanup errors in scoped destruction", () => {
        const view = new ScopedRendered(() => {
            createEffect(({ onCleanup }) => {
                onCleanup(() => {
                    throw new Error("scope cleanup");
                });
            });
            return new NodeRendered(document.createTextNode("A"), () => {
                throw new Error("child cleanup");
            });
        });

        let thrown: unknown = null;
        try {
            view.destroy();
        } catch (error) {
            thrown = error;
        }

        assertInstanceOf(thrown, AggregateError);
        assertSame(thrown.errors.length, 2);
        assertSame(thrown.errors[0] instanceof Error ? thrown.errors[0].message : String(thrown.errors[0]), "child cleanup");
        assertSame(thrown.errors[1] instanceof Error ? thrown.errors[1].message : String(thrown.errors[1]), "scope cleanup");
    });

    it("flattens aggregate errors from child and scope cleanup in scoped lifecycles", () => {
        const disposeView = new ScopedRendered(() => {
            createEffect(({ onCleanup }) => {
                onCleanup(() => {
                    throw new AggregateError([ new Error("scope dispose aggregate") ], "scope dispose aggregate");
                });
            });
            return new NodeRendered(document.createTextNode("A"), () => {
                throw new AggregateError([ new Error("child dispose aggregate") ], "child dispose aggregate");
            });
        });

        let disposeThrown: unknown = null;
        try {
            disposeView.dispose();
        } catch (error) {
            disposeThrown = error;
        }

        assertInstanceOf(disposeThrown, AggregateError);
        assertSame(disposeThrown.errors.length, 2);
        assertSame(disposeThrown.errors[0] instanceof Error ? disposeThrown.errors[0].message : String(disposeThrown.errors[0]), "child dispose aggregate");
        assertSame(disposeThrown.errors[1] instanceof Error ? disposeThrown.errors[1].message : String(disposeThrown.errors[1]), "scope dispose aggregate");

        const destroyView = new ScopedRendered(() => {
            createEffect(({ onCleanup }) => {
                onCleanup(() => {
                    throw new AggregateError([ new Error("scope destroy aggregate") ], "scope destroy aggregate");
                });
            });
            return new NodeRendered(document.createTextNode("A"), () => {
                throw new AggregateError([ new Error("child destroy aggregate") ], "child destroy aggregate");
            });
        });

        let destroyThrown: unknown = null;
        try {
            destroyView.destroy();
        } catch (error) {
            destroyThrown = error;
        }

        assertInstanceOf(destroyThrown, AggregateError);
        assertSame(destroyThrown.errors.length, 2);
        assertSame(destroyThrown.errors[0] instanceof Error ? destroyThrown.errors[0].message : String(destroyThrown.errors[0]), "child destroy aggregate");
        assertSame(destroyThrown.errors[1] instanceof Error ? destroyThrown.errors[1].message : String(destroyThrown.errors[1]), "scope destroy aggregate");
    });

    it("destroys scoped rendered outputs cleanly without errors", () => {
        const [ value, setValue ] = createSignal(0);
        let runs = 0;
        let childCleanups = 0;
        let scopeCleanups = 0;
        const view = new ScopedRendered(() => {
            createEffect(({ onCleanup }) => {
                value();
                runs++;
                onCleanup(() => {
                    scopeCleanups++;
                });
            });
            return new NodeRendered(document.createTextNode("A"), () => {
                childCleanups++;
            });
        });
        const host = document.createElement("div");

        view.insert(host, null);
        assertSame(runs, 1);
        view.destroy();
        view.destroy();

        assertSame(host.textContent, "");
        assertSame(childCleanups, 1);
        assertSame(scopeCleanups, 1);

        setValue(1);
        assertSame(runs, 1);
    });

    it("removes a scoped rendered output when destroying it after disposal", () => {
        let childCleanups = 0;
        let scopeCleanups = 0;
        const view = new ScopedRendered(() => {
            createEffect(({ onCleanup }) => {
                onCleanup(() => {
                    scopeCleanups++;
                });
            });
            return new NodeRendered(document.createTextNode("A"), () => {
                childCleanups++;
            });
        });
        const host = document.createElement("div");

        view.insert(host, null);
        view.dispose();

        assertSame(host.textContent, "A");
        assertSame(childCleanups, 1);
        assertSame(scopeCleanups, 1);

        view.destroy();
        view.destroy();

        assertSame(host.textContent, "");
        assertSame(childCleanups, 1);
        assertSame(scopeCleanups, 1);
    });

    it("allows disposing a scoped rendered output after destruction", () => {
        let childCleanups = 0;
        let scopeCleanups = 0;
        const view = new ScopedRendered(() => {
            createEffect(({ onCleanup }) => {
                onCleanup(() => {
                    scopeCleanups++;
                });
            });
            return new NodeRendered(document.createTextNode("A"), () => {
                childCleanups++;
            });
        });
        const host = document.createElement("div");

        view.insert(host, null);
        view.destroy();

        assertSame(host.textContent, "");
        assertSame(childCleanups, 1);
        assertSame(scopeCleanups, 1);

        view.dispose();
        view.dispose();

        assertSame(host.textContent, "");
        assertSame(childCleanups, 1);
        assertSame(scopeCleanups, 1);
    });

    it("recreates a scoped rendered output after destruction", () => {
        let instances = 0;
        let childCleanups = 0;
        let scopeCleanups = 0;
        const view = new ScopedRendered(() => {
            const instance = ++instances;
            createEffect(({ onCleanup }) => {
                onCleanup(() => {
                    scopeCleanups++;
                });
            });
            return new NodeRendered(document.createTextNode(String(instance)), () => {
                childCleanups++;
            });
        });
        const firstHost = document.createElement("div");
        const secondHost = document.createElement("div");

        view.insert(firstHost, null);
        view.destroy();

        assertSame(firstHost.textContent, "");
        assertSame(instances, 1);
        assertSame(childCleanups, 1);
        assertSame(scopeCleanups, 1);

        view.insert(secondHost, null);

        assertSame(secondHost.textContent, "2");
        assertSame(instances, 2);

        view.destroy();

        assertSame(secondHost.textContent, "");
        assertSame(childCleanups, 2);
        assertSame(scopeCleanups, 2);
    });

    it("reinitializes scoped rendered getters after destruction", () => {
        let instances = 0;
        const view = new ScopedRendered(() => {
            instances++;
            return new NodeRendered(document.createTextNode(String(instances)));
        });

        const firstNode = view.getFirstNode();
        const lastNode = view.getLastNode();
        const singleNode = view.getSingleNode();

        view.destroy();

        const nextFirstNode = view.getFirstNode();
        const nextLastNode = view.getLastNode();
        const nextSingleNode = view.getSingleNode();

        assertSame(instances, 2);
        assertSame(firstNode === nextFirstNode, false);
        assertSame(lastNode === nextLastNode, false);
        assertSame(singleNode === nextSingleNode, false);
    });

    it("reinitializes the scoped rendered last-node getter after destruction", () => {
        let instances = 0;
        const view = new ScopedRendered(() => {
            instances++;
            return new NodeRendered(document.createTextNode(String(instances)));
        });

        view.destroy();
        const lastNode = view.getLastNode();

        assertSame(instances, 2);
        assertSame(lastNode?.textContent, "2");
    });

    it("continues from destroy callbacks into final disposal", () => {
        class TestRendered extends RenderedBase {
            public constructor() {
                super();
            }

            protected override onInsert(parent: Node & ParentNode, before: ChildNode | null): void {
                void parent;
                void before;
            }

            public override getFirstNode(): ChildNode | null {
                return null;
            }

            public override getLastNode(): ChildNode | null {
                return null;
            }

            public override getSingleNode(): ChildNode | null {
                return null;
            }

            public registerDestroyCallback(callback: () => void): void {
                this.addDestroyCallback(callback);
            }

            public registerDisposeCallback(callback: () => void): void {
                this.addDisposeCallback(callback);
            }
        }

        const view = new TestRendered();
        let disposed = false;
        view.registerDestroyCallback(() => {
            throw new Error("destroy callback");
        });
        view.registerDisposeCallback(() => {
            disposed = true;
        });

        assertThrowWithMessage(() => view.destroy(), Error, "destroy callback");
        assertSame(disposed, true);
    });

    it("does not rerun release callbacks after disposal followed by destruction", () => {
        class TestRendered extends RenderedBase {
            public constructor() {
                super();
            }

            protected override onInsert(parent: Node & ParentNode, before: ChildNode | null): void {
                void parent;
                void before;
            }

            public override getFirstNode(): ChildNode | null {
                return null;
            }

            public override getLastNode(): ChildNode | null {
                return null;
            }

            public override getSingleNode(): ChildNode | null {
                return null;
            }

            public registerDisposeCallback(callback: () => void): void {
                this.addDisposeCallback(callback);
            }
        }

        const view = new TestRendered();
        let runs = 0;
        view.registerDisposeCallback(() => {
            runs++;
        });

        view.dispose();
        view.destroy();

        assertSame(runs, 1);
    });

    it("allows custom internal rendered outputs in tests", () => {
        class TestRendered extends RenderedBase {
            public constructor() {
                super();
            }

            protected override onInsert(parent: Node & ParentNode, before: ChildNode | null): void {
                if (before == null) {
                    parent.append(document.createTextNode("x"));
                } else {
                    before.before(document.createTextNode("x"));
                }
            }

            public override getFirstNode(): ChildNode | null {
                return null;
            }

            public override getLastNode(): ChildNode | null {
                return null;
            }

            public override getSingleNode(): ChildNode | null {
                return null;
            }
        }

        assertInstanceOf(new TestRendered(), Rendered);
    });

    it("allows reinserting a destroyed rendered output", () => {
        const rendered = new Group(materialize("A"));
        const firstHost = document.createElement("div");
        const secondHost = document.createElement("div");

        rendered.insert(firstHost, null);
        rendered.destroy();
        rendered.insert(secondHost, null);

        assertSame(firstHost.textContent, "");
        assertSame(secondHost.textContent, "A");
    });

    it("throws when trying to insert a disposed rendered output again", () => {
        const rendered = new Group(materialize("A"));
        const firstHost = document.createElement("div");
        const secondHost = document.createElement("div");

        rendered.insert(firstHost, null);
        rendered.dispose();

        assertThrowWithMessage(() => rendered.insert(secondHost, null), Error, "Cannot use a disposed rendered output");
    });

    it("does not let the previous parent destroy a moved child", () => {
        const firstParent = new Group();
        const secondParent = new Group();
        const child = materialize("A");
        const host = document.createElement("div");

        firstParent.insert(host, null);
        secondParent.insert(host, null);
        firstParent.appendChild(child);
        secondParent.appendChild(child);
        firstParent.destroy();

        assertSame(host.textContent, "A");
    });

    it("allows disposing a dynamic rendered output after destruction", () => {
        class TestDynamicRendered extends DynamicRendered {
            public disposed = false;

            protected override onDispose(): void {
                this.disposed = true;
                super.onDispose();
            }
        }

        const rendered = new TestDynamicRendered(() => materialize("A"));

        rendered.destroy();
        rendered.dispose();

        assertSame(rendered.disposed, true);
    });

    it("stops dynamic updates when child cleanup throws during disposal", () => {
        const [ value, setValue ] = createSignal(0);
        let runs = 0;
        const rendered = new DynamicRendered(() => {
            runs++;
            return new NodeRendered(document.createTextNode(String(value())), () => {
                throw new Error("child cleanup");
            });
        });

        assertSame(runs, 1);
        assertThrowWithMessage(() => rendered.dispose(), Error, "child cleanup");

        setValue(1);
        assertSame(runs, 1);
    });

    it("allows destroying a dynamic rendered output after disposal", () => {
        const rendered = new DynamicRendered(() => materialize("A"));

        rendered.dispose();
        rendered.destroy();
    });

    it("inserts dynamic rendered outputs through an already initialized group", () => {
        const rendered = new DynamicRendered(() => materialize("A"));
        const host = document.createElement("div");

        rendered.insert(host, null);

        assertSame(host.textContent, "A");
    });

    it("reinitializes dynamic rendered getters after destruction", () => {
        const rendered = new DynamicRendered(() => materialize("A"));

        const firstNode = rendered.getFirstNode();
        const lastNode = rendered.getLastNode();

        rendered.destroy();

        const nextFirstNode = rendered.getFirstNode();
        const nextLastNode = rendered.getLastNode();

        assertSame(firstNode === nextFirstNode, false);
        assertSame(lastNode === nextLastNode, false);
        assertSame(rendered.getSingleNode(), null);
    });

    it("reinitializes the dynamic rendered last-node getter after destruction", () => {
        const rendered = new DynamicRendered(() => materialize("A"));

        rendered.destroy();
        const lastNode = rendered.getLastNode();

        assertInstanceOf(lastNode, Comment);
    });
});
