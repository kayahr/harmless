/*
 * Copyright (C) 2024 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { signal } from "@kayahr/signal";

import { render } from "../../main/utils/render.js";

// In this example a signal is used to count the number of button clicks and reactively update the displayed count.

const count = signal(0);
const increment = () => { count.update(value => value + 1); };

document.body.appendChild(render(<>
  <div>
    Count: {count}
  </div>
  <button onclick={increment}>Increment</button>
</>));
