/*
 * Copyright (C) 2026 Klaus Reimer
 * SPDX-License-Identifier: MIT
 */

import { A, Route, Routes, render, routeParams } from "@kayahr/harmless";

function User() {
    return <h1>User {() => routeParams().id}</h1>;
}

document.body.append(render(<>
  <nav>
    <A href="/" activeClass="active">Home</A>
    {" | "}
    <A href="/users" activeClass="active">Users</A>
    {" | "}
    <A href="/users/42" activeClass="active">User 42</A>
    {" | "}
    <A href="/users/Arthur%20Dent" activeClass="active">Arthur Dent</A>
  </nav>
  <Routes>
    <Route path="/"><h1>Home</h1></Route>
    <Route path="/users"><h1>Users</h1></Route>
    <Route path="/users/:id"><User /></Route>
  </Routes>
</>));
