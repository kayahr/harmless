import { Component, type ComponentSource } from "../Component.ts";
import type { Element, Properties } from "./types.ts";

export function getChildComponents<T extends ComponentSource<P, R>, P extends Properties, R extends Element>(children: Element,
        source: T & ComponentSource<P, R>): Array<Component<T, P, R>> {
    const childComponents = (children instanceof Array ? children : [ children ]).filter(child => child instanceof Component);
    return childComponents.filter(child => child.getSource() === source) as Array<Component<T, P, R>>;
}

export function getChildComponent<T extends ComponentSource<P, R>, P extends Properties, R extends Element>(children: Element,
        source: T & ComponentSource<P, R>): Component<T, P, R> | null {
    const childComponents = (children instanceof Array ? children : [ children ]).filter(child => child instanceof Component);
    return childComponents.find(child => child.getSource() === source) as Component<T, P, R> ?? null;
}

export function getChildRenderings<P extends Properties, R extends Element>(children: Element, source: ComponentSource<P, R>): R[] {
    const sourceComponents = getChildComponents(children, source);
    return sourceComponents.map(component => component.renderSync()).filter(rendering => !(rendering instanceof Promise));
}
