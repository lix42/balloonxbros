// Public item photos uploaded in /admin (R2 keys under photos/).
import { createFileRoute } from "@tanstack/react-router";
import { env } from "cloudflare:workers";
import { getPhoto } from "../../../worker/service";
import { errorResponse, photoResponse } from "../../file-response";

export const Route = createFileRoute("/api/files/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        try {
          return photoResponse(await getPhoto(env, params._splat ?? ""));
        } catch (err) {
          return errorResponse(err);
        }
      },
    },
  },
});
