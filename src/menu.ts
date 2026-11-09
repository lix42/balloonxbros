// The menu and event settings, read from D1 on the server so the first
// page load already contains them (SSR). Later refreshes use /api/menu.
import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import type { MenuResponse } from "../shared/types";
import { getSettings, listItems } from "../worker/db";

export const getMenu = createServerFn({ method: "GET" }).handler(
  async (): Promise<MenuResponse> => {
    try {
      const [items, settings] = await Promise.all([listItems(env.DB, false), getSettings(env.DB)]);
      return { items, settings };
    } catch (err) {
      // Start serializes a loader error into the page for the client, so keep
      // the real cause in the Worker logs and send a generic one.
      console.error("getMenu", err);
      throw new Error("Menu unavailable.");
    }
  },
);
