/*
 * Copyright (C) 2026 Klaus Reimer
 * SPDX-License-Identifier: MIT
 */

/**
 * Appends the given error, flattening aggregate errors into the target list.
 *
 * @param errors - The target error list.
 * @param error  - The error to append.
 */
export function pushError(errors: unknown[], error: unknown): void {
    errors.push(...(error instanceof AggregateError ? error.errors : [ error ]));
}

/**
 * Executes the given callback and appends any thrown error to the target list.
 *
 * @param errors   - The target error list.
 * @param callback - The callback to execute.
 */
export function collectError(errors: unknown[], callback: () => void): void {
    try {
        callback();
    } catch (error) {
        pushError(errors, error);
    }
}

/**
 * Throws the given collected errors, if any.
 *
 * @param errors  - The collected errors.
 * @param message - The aggregate error message.
 */
export function throwErrors(errors: readonly unknown[], message = "Harmless cleanup failed"): void {
    if (errors.length === 1) {
        throw errors[0];
    }
    if (errors.length > 1) {
        throw new AggregateError(errors, message);
    }
}
