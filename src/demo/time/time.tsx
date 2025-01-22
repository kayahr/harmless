/*
 * Copyright (C) 2024 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

// This example shows how to output text which is periodically updated via an Observable

import { Observable } from "@kayahr/observable";

import { render } from "../../main/utils/render.js";

// There are shorter ways to create a timer observable, for example with an RxJS's timer,
// but let's keep it as raw as possible here
const currentTime = new Observable<Date>(observer => {
    observer.next(new Date());
    const interval = setInterval(() => observer.next(new Date()), 1000);
    return () => clearInterval(interval);
});

document.body.appendChild(render(<span>Current time: {currentTime}</span>));
