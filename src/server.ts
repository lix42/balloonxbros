// The Worker's entry point (wrangler.jsonc "main"). /api/* goes straight to
// the existing API handler with its real env and ctx; everything else is
// rendered by TanStack Start.
import handler from "@tanstack/react-start/server-entry";
import api from "../worker/index";

export default {
  fetch(request, env, ctx) {
    if (new URL(request.url).pathname.startsWith("/api/")) {
      return api.fetch(request, env, ctx);
    }
    return handler.fetch(request);
  },
} satisfies ExportedHandler<Env>;
