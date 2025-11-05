/*
 * Copyright (C) 2024 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { Route, RouteParams, Routes } from "../../main/components/Route.ts";
import { component } from "../../main/utils/component.ts";
import { render } from "../../main/utils/render.ts";

function User(props: unknown, params: RouteParams<{ id: string }>) {
    return <div>User {() => params.get().id}</div>;
}
component(User, { inject: [ RouteParams ] });

document.body.appendChild(render(<>
    <div>
      <Routes>
        <Route path="/">Root</Route>
        <Route path="/users">Users</Route>
        <Route path="/user/:id"><User /></Route>
      </Routes>
    </div>
    <ul>
      <li><a href="#/">Root</a></li>
      <li><a href="#/users">Users</a></li>
      <li><a href="#/user/1234">User 1234</a></li>
      <li><a href="#/user/555">User 555</a></li>
    </ul>
</>));
