/*
 * Copyright (C) 2024 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { If, render } from "@kayahr/harmless";
import { createSignal } from "@kayahr/signal";

// In this example the built-in `If` component is used to conditionally display content.

const Content = () => {
    console.log("Created content");
    return <div>Content is visible</div>;
};

const Fallback = () => {
    console.log("Created fallback");
    return <>Content is NOT visible</>;
};

const [ visible, setVisible ] = createSignal(true);
const toggle = () => setVisible(visible => !visible);

document.body.appendChild(render(<>
  <div>
    <If test={visible} else={<Fallback />}>
      <Content />
    </If>
  </div>
  <button on:click={toggle}>Toggle visibility</button>
</>));
