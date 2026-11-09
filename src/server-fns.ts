// The API as TanStack Start server functions. Each one is a thin wrapper over
// worker/service.ts that returns a Result instead of throwing (see ./result),
// so the HTTP-like status (e.g. 409 when stock changed) reaches the client
// intact; src/api.ts unwraps it into an ApiError.
import { createServerFn } from "@tanstack/react-start";
import { getRequest, setResponseHeader } from "@tanstack/react-start/server";
import { env, waitUntil } from "cloudflare:workers";
import type { Item, OrderStatus, Settings } from "../shared/types";
import * as svc from "../worker/service";
import { HttpError } from "../worker/validate";
import { run, type Result } from "./result";

export type { Result };

/** Every answer is per-user and live (menu stock, admin data): never cache. */
function respond<T>(work: () => Promise<T>): Promise<Result<T>> {
  setResponseHeader("Cache-Control", "no-store");
  return run(work);
}

const admin = () => svc.requireAdmin(env, getRequest());

// Network input is only claimed to match the validator types, so these check
// the shape inside respond(): a bad payload is a normal 400 Result. The service
// functions then validate each field.
function object<T extends object>(data: T): T {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new HttpError(400, "Invalid input.");
  }
  return data;
}

function formData(data: FormData): FormData {
  if (!(data instanceof FormData)) throw new HttpError(400, "Invalid form submission.");
  return data;
}

function fieldString(form: FormData, name: string): string {
  const value = form.get(name);
  return typeof value === "string" ? value : "";
}

// ---------- public ----------

export const getMenuFn = createServerFn({ method: "GET" }).handler(() =>
  respond(() => svc.getMenu(env)),
);

export const submitOrderFn = createServerFn({ method: "POST" })
  .validator((data: FormData) => data)
  .handler(({ data }) => respond(() => svc.createOrder(env, formData(data), waitUntil)));

// ---------- admin ----------

export const adminLoginFn = createServerFn({ method: "POST" })
  .validator((data: { password: string }) => data)
  .handler(({ data }) =>
    respond(async () => {
      setResponseHeader("Set-Cookie", await svc.adminLogin(env, object(data).password));
      return { ok: true as const };
    }),
  );

export const adminLogoutFn = createServerFn({ method: "POST" }).handler(() =>
  respond(async () => {
    setResponseHeader("Set-Cookie", svc.adminLogout());
    return { ok: true as const };
  }),
);

export const adminMeFn = createServerFn({ method: "GET" }).handler(() =>
  respond(async () => {
    await admin();
    return { ok: true as const };
  }),
);

export const adminOrdersFn = createServerFn({ method: "GET" }).handler(() =>
  respond(async () => ({ orders: await svc.adminOrders(env, await admin()) })),
);

export const adminUpdateOrderFn = createServerFn({ method: "POST" })
  .validator((data: { id: string; patch: { status?: OrderStatus; adminNote?: string } }) => data)
  .handler(({ data }) =>
    respond(async () => {
      const auth = await admin();
      const { id, patch } = object(data);
      return { order: await svc.adminUpdateOrder(env, auth, String(id), object(patch)) };
    }),
  );

export const adminItemsFn = createServerFn({ method: "GET" }).handler(() =>
  respond(async () => ({ items: await svc.adminItems(env, await admin()) })),
);

export const adminCreateItemFn = createServerFn({ method: "POST" })
  .validator((data: Partial<Item> & { id: string }) => data)
  .handler(({ data }) =>
    respond(async () => ({ items: await svc.adminCreateItem(env, await admin(), object(data)) })),
  );

export const adminUpdateItemFn = createServerFn({ method: "POST" })
  .validator((data: { id: string; patch: Partial<Item> }) => data)
  .handler(({ data }) =>
    respond(async () => {
      const auth = await admin();
      const { id, patch } = object(data);
      return { items: await svc.adminUpdateItem(env, auth, String(id), object(patch)) };
    }),
  );

export const adminUploadPhotoFn = createServerFn({ method: "POST" })
  .validator((data: FormData) => data)
  .handler(({ data }) =>
    respond(async () => {
      const auth = await admin();
      const form = formData(data);
      return {
        items: await svc.adminUploadPhoto(env, auth, fieldString(form, "id"), form.get("photo")),
      };
    }),
  );

export const adminSettingsFn = createServerFn({ method: "GET" }).handler(() =>
  respond(async () => ({ settings: await svc.adminSettings(env, await admin()) })),
);

export const adminSaveSettingsFn = createServerFn({ method: "POST" })
  .validator((data: Partial<Settings>) => data)
  .handler(({ data }) =>
    respond(async () => ({
      settings: await svc.adminSaveSettings(env, await admin(), object(data)),
    })),
  );
