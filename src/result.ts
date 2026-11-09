// How the API's outcome crosses the network: the server functions return a
// Result (run), and the browser turns a failed one into an ApiError (call).
// Kept free of Start and Workers imports so it can be unit-tested.
import { HttpError } from "../worker/validate";

export type Result<T> = { ok: true; data: T } | { ok: false; status: number; error: string };

const GENERIC = "Something went wrong. Please try again.";

/** Server side: an HttpError keeps its status and message; anything else is
 *  logged and becomes a generic 500, so internals never reach the browser. */
export async function run<T>(work: () => Promise<T>): Promise<Result<T>> {
  try {
    return { ok: true, data: await work() };
  } catch (err) {
    if (err instanceof HttpError) return { ok: false, status: err.status, error: err.message };
    console.error(err);
    return { ok: false, status: 500, error: GENERIC };
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
  }
}

/** Browser side: returns the data, or throws an ApiError with the server's
 *  status and message. A call that never got a Result (network down, or the
 *  framework failed) is status 0. */
export async function call<T>(request: Promise<Result<T>>): Promise<T> {
  let result: Result<T>;
  try {
    result = await request;
  } catch (err) {
    console.error("server function failed", err);
    const offline = err instanceof TypeError; // what fetch throws when it can't connect
    throw new ApiError(
      0,
      offline ? "Couldn't reach the server. Check your connection and try again." : GENERIC,
      { cause: err },
    );
  }
  if (!result.ok) throw new ApiError(result.status, result.error);
  return result.data;
}
