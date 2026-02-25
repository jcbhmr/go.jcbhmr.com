#!/usr/bin/env -S deno serve
import projects from "./projects.json" with { type: "json" };

interface Project {
  rootPath: string;
  vcs: string;
  repoURL: string;
  subdirectory?: string;
}

function isGoGet(request: Request): boolean {
  const url = new URL(request.url);
  return url.searchParams.get("go-get") === "1";
}

function metaGoImport(project: Project): string {
  const fields = [project.rootPath, project.vcs, project.repoURL];
  if (project.subdirectory != null) {
    fields.push(project.subdirectory);
  }
  return `<meta name="go-import" content="${fields.join(" ")}">`;
}

function metaRedirect(dest: string | URL): string {
  return `<meta http-equiv="refresh" content="0; url=${dest}">`;
}

function scriptRedirect(dest: string | URL): string {
  return `<script>location.replace(${encodeHTML(JSON.stringify(dest))})</script>`;
}

function encodeHTML(str: string): string {
  const map = {
    __proto__: null!,
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return str.replaceAll(/[&<>"']/g, (m) => map[m as keyof typeof map]);
}

function responseHTML(html: string, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "text/html; charset=UTF-8");
  return new Response(html, { ...init, headers })
}

const patterns = projects.map((project) => {
  const name = project.rootPath.replace(/^go\.jcbhmr\.com\//, "");
  const pattern = new URLPattern({
    pathname: `/${name}(/*)?`,
  });
  return {
    pattern,
    fetch(request: Request): Response {
      const url = new URL(request.url);
      const docs = `https://pkg.go.dev/${url.hostname}${url.pathname}`;
      return responseHTML(
        metaGoImport(project)
        + metaRedirect(docs)
        + scriptRedirect(docs),
      );
    }
  };
})

export default {
  fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/") {
      return Response.redirect("https://github.com/jcbhmr?tab=repositories&q=&type=&language=go&sort=");
    }
    for (const { pattern, fetch } of patterns) {
      if (pattern.test(request.url)) {
        return fetch(request);
      }
    }
    return new Response("Not Found", { status: 404 });
  }
} satisfies Deno.ServeDefaultExport;
