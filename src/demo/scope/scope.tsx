/*
 * Copyright (C) 2026 Klaus Reimer
 * SPDX-License-Identifier: MIT
 */

import { InjectionToken, injector } from "@kayahr/di";
import { type JSX, type NoProps, type ParentProps, component, render } from "@kayahr/harmless";
import { Scope } from "@kayahr/scope";

const userIdToken = new InjectionToken<string>("user-id");

interface UserProps extends ParentProps {
    id: string;
}

function User(props: UserProps, scope: Scope): JSX.Element {
    injector.setValue(props.id, userIdToken, { scope });
    return props.children ?? null;
}
component(User, [ Scope ]);

function UserId(props: NoProps, userId: string): JSX.Element {
    void props;
    return userId;
}
component(UserId, [ userIdToken ]);

document.body.appendChild(render(
    <div>
        <h1>Scoped user ids</h1>
        <User id="alice">
            <p>Outer user: <UserId /></p>
            <User id="bob">
                <p>Inner user: <UserId /></p>
            </User>
            <p>Outer user again: <UserId /></p>
        </User>
    </div>
));
