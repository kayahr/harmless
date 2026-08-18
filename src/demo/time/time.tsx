/*
 * Copyright (C) 2024 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { Observable } from "@kayahr/observable";
import { render } from "@kayahr/harmless";

// This example shows how to output text which is periodically updated via an observable.

const currentTime = new Observable<string>(observer => {
    observer.next(new Date().toString());
    const interval = setInterval(() => observer.next(new Date().toString()), 1000);
    return () => clearInterval(interval);
});

document.body.appendChild(render(<span>Current time: {currentTime}</span>));
