// Responses for the file routes (src/routes/api/), kept as plain functions so
// the headers can be unit-tested.
import { HttpError } from "../worker/validate";

const NO_STORE = { "Cache-Control": "no-store" };

const contentType = (obj: R2ObjectBody) =>
  obj.httpMetadata?.contentType ?? "application/octet-stream";

/** A public item photo: cached for good (each upload gets a new key). */
export function photoResponse(obj: R2ObjectBody): Response {
  return new Response(obj.body, {
    headers: {
      "Content-Type": contentType(obj),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

/** A donation receipt: never cached, and never sniffed as another type
 *  (buyers upload these files). */
export function receiptResponse(obj: R2ObjectBody): Response {
  return new Response(obj.body, {
    headers: {
      "Content-Type": contentType(obj),
      "Cache-Control": "private, no-store",
      "Content-Disposition": "inline",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

/** JSON error response (HttpError status, else a logged, generic 500). */
export function errorResponse(err: unknown): Response {
  if (err instanceof HttpError) {
    return Response.json({ error: err.message }, { status: err.status, headers: NO_STORE });
  }
  console.error(err);
  return Response.json(
    { error: "Something went wrong. Please try again." },
    { status: 500, headers: NO_STORE },
  );
}
