// The browser's API client: calls the server functions in ./server-fns and
// turns a failed Result into an ApiError (see ./result).
import type {
  AdminOrder,
  Item,
  MenuResponse,
  OrderInput,
  OrderStatus,
  PublicOrder,
  Settings,
} from "../shared/types";
import {
  adminCreateItemFn,
  adminItemsFn,
  adminLoginFn,
  adminLogoutFn,
  adminMeFn,
  adminOrdersFn,
  adminSaveSettingsFn,
  adminSettingsFn,
  adminUpdateItemFn,
  adminUpdateOrderFn,
  adminUploadPhotoFn,
  getMenuFn,
  submitOrderFn,
} from "./server-fns";
import { ApiError, call } from "./result";

export { ApiError };

export const api = {
  menu: (): Promise<MenuResponse> => call(getMenuFn()),

  /** `receipt` is the school donation's receipt; a Venmo order has none. */
  submitOrder: (input: OrderInput, receipt: File | null) => {
    const form = new FormData();
    form.set("order", JSON.stringify(input));
    if (receipt) form.set("receipt", receipt);
    return call<{ order: PublicOrder; settings: Settings }>(submitOrderFn({ data: form }));
  },

  admin: {
    login: (password: string) => call(adminLoginFn({ data: { password } })),
    logout: () => call(adminLogoutFn()),
    me: () => call(adminMeFn()),
    orders: (): Promise<{ orders: AdminOrder[] }> => call(adminOrdersFn()),
    updateOrder: (id: string, patch: { status?: OrderStatus; adminNote?: string }) =>
      call(adminUpdateOrderFn({ data: { id, patch } })),
    items: (): Promise<{ items: Item[] }> => call(adminItemsFn()),
    createItem: (data: Partial<Item> & { id: string }) => call(adminCreateItemFn({ data })),
    updateItem: (id: string, patch: Partial<Item>) =>
      call(adminUpdateItemFn({ data: { id, patch } })),
    uploadPhoto: (id: string, file: File) => {
      const form = new FormData();
      form.set("id", id);
      form.set("photo", file);
      return call(adminUploadPhotoFn({ data: form }));
    },
    settings: (): Promise<{ settings: Settings }> => call(adminSettingsFn()),
    saveSettings: (s: Partial<Settings>) => call(adminSaveSettingsFn({ data: s })),
  },
};
