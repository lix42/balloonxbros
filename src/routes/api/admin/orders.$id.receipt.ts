// An order's donation receipt, for the admin page's "View receipt" link.
import { createFileRoute } from "@tanstack/react-router";
import { env } from "cloudflare:workers";
import { adminReceipt, requireAdmin } from "../../../../worker/service";
import { errorResponse, receiptResponse } from "../../../file-response";

export const Route = createFileRoute("/api/admin/orders/$id/receipt")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        try {
          return receiptResponse(
            await adminReceipt(env, await requireAdmin(env, request), params.id),
          );
        } catch (err) {
          return errorResponse(err);
        }
      },
    },
  },
});
