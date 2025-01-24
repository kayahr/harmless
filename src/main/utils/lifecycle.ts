/*
 * Copyright (C) 2024 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information.
 */

import { SignalScope } from "@kayahr/signal";

/**
 * Registers a function in the current component scope which is called when component is destroyed. For function component this must be used within the
 * component function. For class components it must be used in the constructor or the render method. When used anywhere else then the destroy handler is
 * never called.
 *
 * @param destroy - The destroy handler function to register.
 */
export function onDestroy(destroy: () => void): void {
    SignalScope.registerDestroyable({ destroy });
}
