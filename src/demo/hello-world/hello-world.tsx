/*
 * Copyright (C) 2024 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { render } from "../../main/utils/render.js";

// Most simple example which just outputs a static text

function HelloWorld() {
    return <h1>Hello World</h1>;
}

document.body.appendChild(render(<HelloWorld />));
