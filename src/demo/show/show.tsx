/*
 * Copyright (C) 2024 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { Show, component, render } from "@kayahr/harmless";
import { signal } from "@kayahr/signal";

import { RouteParams } from "../../main/components/Route.ts";

// In this example the built-in `Show` component is used to conditionally display content.

const Content = (props: unknown, params: RouteParams) => {
    console.log("Created content", params);
    return <>Content is visible</>;
};
component(Content, { inject: [ RouteParams ] });

const Fallback = () => {
    console.log("Created fallback");
    return <>Content is NOT visible</>;
};

const visible = signal(true);
const toggle = () => visible.update(visible => !visible);

document.body.appendChild(render(<>
  <div>
    <Show when={visible} fallback={<Fallback />}>
      <Content />
    </Show>
  </div>
  <button onclick={toggle}>Toggle visibility</button>
</>));
