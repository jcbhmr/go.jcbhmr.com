#!/usr/bin/env -S deno serve
const pattern = new URLPattern({ pathname: "/:name" });
export default {
  fetch() {
    const url = new URL(request.url);
    if (url.pathname === "/") {
      return Response.redirect("https://github.com/jcbhmr?tab=repositories&q=&type=&language=go&sort=");
    }
    return new Response("Hello!");
  }
} satisfies Deno.ServeDefaultExport;
