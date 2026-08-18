/*
 * Copyright (C) 2024 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { createSignal } from "@kayahr/signal";
import { render } from "@kayahr/harmless";

// In this example a signal is used to count the number of button clicks and reactively update the displayed count.

const [ count, setCount ] = createSignal(0);
const increment = () => { setCount(value => value + 1); };

document.body.appendChild(render(<>
  <div>
    Count: {count}
  </div>
  <button on:click={increment}>Increment</button>
</>));
