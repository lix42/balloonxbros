import type {
  AdminOrder,
  Item,
  MenuResponse,
  OrderInput,
  OrderStatus,
  PublicOrder,
  Settings,
} from "../shared/types";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, { credentials: "same-origin", ...init });
  } catch {
    throw new ApiError(0, "Couldn't reach the server. Check your connection and try again.");
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, body.error ?? `Request failed (${res.status}).`);
  return body as T;
}

const jsonInit = (method: string, data: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data),
});

export const api = {
  menu: () => request<MenuResponse>("/api/menu"),

  submitOrder: (input: OrderInput, receipt: File) => {
    const form = new FormData();
    form.set("order", JSON.stringify(input));
    form.set("receipt", receipt);
    return request<{ order: PublicOrder; settings: Settings }>("/api/orders", {
      method: "POST",
      body: form,
    });
  },

  admin: {
    login: (password: string) => request<{ ok: true }>("/api/admin/login", jsonInit("POST", { password })),
    logout: () => request<{ ok: true }>("/api/admin/logout", { method: "POST" }),
    me: () => request<{ ok: true }>("/api/admin/me"),
    orders: () => request<{ orders: AdminOrder[] }>("/api/admin/orders"),
    updateOrder: (id: string, patch: { status?: OrderStatus; adminNote?: string }) =>
      request<{ order: AdminOrder }>(`/api/admin/orders/${id}`, jsonInit("PATCH", patch)),
    items: () => request<{ items: Item[] }>("/api/admin/items"),
    createItem: (data: Partial<Item> & { id: string }) =>
      request<{ items: Item[] }>("/api/admin/items", jsonInit("POST", data)),
    updateItem: (id: string, patch: Partial<Item>) =>
      request<{ items: Item[] }>(`/api/admin/items/${id}`, jsonInit("PATCH", patch)),
    uploadPhoto: (id: string, file: File) => {
      const form = new FormData();
      form.set("photo", file);
      return request<{ items: Item[] }>(`/api/admin/items/${id}/photo`, { method: "POST", body: form });
    },
    settings: () => request<{ settings: Settings }>("/api/admin/settings"),
    saveSettings: (s: Partial<Settings>) =>
      request<{ settings: Settings }>("/api/admin/settings", jsonInit("PUT", s)),
  },
};
