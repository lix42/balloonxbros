import { env } from "cloudflare:workers";
import { beforeEach, describe, expect, it } from "vite-plus/test";
import {
  adminCreateItem,
  adminItems,
  adminLogin,
  adminLogout,
  adminOrders,
  adminReceipt,
  adminSaveSettings,
  adminUpdateItem,
  adminUpdateOrder,
  adminUploadPhoto,
  createOrder,
  getMenu,
  getPhoto,
  requireAdmin,
} from "../../worker/service";
import type { PublicOrder } from "../../shared/types";
import {
  adminAuth,
  adminCookie,
  adminRequest,
  background,
  orderForm,
  rejection,
  reset,
  stockOf,
} from "./helpers";

beforeEach(reset);

async function placeOrder(
  lines: { itemId: string; qty: number }[],
  payment?: unknown,
): Promise<PublicOrder> {
  return (await createOrder(env, orderForm({ lines, payment }), background())).order;
}

describe("admin login", () => {
  it("returns a site-wide session cookie for the right password only", async () => {
    const [session, legacy] = await adminLogin(env, "test-password");
    expect(session).toMatch(
      /^bxb_admin=.+; Path=\/; HttpOnly; Secure; SameSite=Strict; Max-Age=\d+$/,
    );
    // A cookie from before the move to Path=/ is expired, so logout can end it.
    expect(legacy).toMatch(/^bxb_admin=; Path=\/api\/admin; .*Max-Age=0$/);
    expect(await rejection(adminLogin(env, "guess"))).toEqual({
      status: 401,
      message: "Wrong password.",
    });
    expect((await rejection(adminLogin(env, { toString: () => "test-password" }))).status).toBe(
      401,
    );
  });

  it("expires both the current and the pre-Path=/ cookie on logout", () => {
    const cookies = adminLogout();
    expect(cookies).toHaveLength(2);
    expect(cookies[0]).toMatch(/^bxb_admin=; Path=\/; .*Max-Age=0$/);
    expect(cookies[1]).toMatch(/^bxb_admin=; Path=\/api\/admin; .*Max-Age=0$/);
  });
});

describe("admin session check", () => {
  it("accepts the login cookie and rejects none, a forged or a tampered one", async () => {
    const good = await adminCookie();
    await expect(requireAdmin(env, adminRequest(good))).resolves.toBeDefined();
    for (const cookie of ["", "bxb_admin=forged.value", `${good}x`]) {
      expect(await rejection(requireAdmin(env, adminRequest(cookie)))).toEqual({
        status: 401,
        message: "Please log in.",
      });
    }
  });
});

describe("admin orders", () => {
  it("lists orders with their lines and serves the receipt", async () => {
    const order = await placeOrder([{ itemId: "sword", qty: 2 }]);
    const auth = await adminAuth();

    const orders = await adminOrders(env, auth);
    expect(orders).toHaveLength(1);
    expect(orders[0]).toMatchObject({
      id: order.id,
      email: "ada@example.com",
      totalCents: 1400,
      status: "submitted",
      paymentMethod: "school",
      payment: {
        method: "school",
        receiptUrl: `/api/admin/orders/${order.id}/receipt`,
        receiptType: "image/png",
      },
      emailSent: false,
    });

    const receipt = await adminReceipt(env, auth, order.id);
    expect(receipt.httpMetadata?.contentType).toBe("image/png");
    expect((await receipt.arrayBuffer()).byteLength).toBe(64);

    expect((await rejection(adminReceipt(env, auth, "BXB-ZZZZZ"))).status).toBe(404);
  });

  it("lists a Venmo order with the username to look for, and no receipt", async () => {
    const order = await placeOrder([{ itemId: "dog", qty: 1 }], {
      method: "venmo",
      venmoUsername: "@ada",
    });
    const auth = await adminAuth();
    const [listed] = await adminOrders(env, auth);
    expect(listed).toMatchObject({
      id: order.id,
      paymentMethod: "venmo",
      payment: { method: "venmo", venmoUsername: "ada" },
    });
    expect(await rejection(adminReceipt(env, auth, order.id))).toEqual({
      status: 404,
      message: "Receipt not found.",
    });
  });

  it("returns limited stock on cancel and takes it again on un-cancel", async () => {
    const order = await placeOrder([
      { itemId: "star", qty: 2 },
      { itemId: "dog", qty: 1 },
    ]);
    const auth = await adminAuth();
    expect(await stockOf("star")).toBe(1);

    const cancelled = await adminUpdateOrder(env, auth, order.id, { status: "cancelled" });
    expect(cancelled.status).toBe("cancelled");
    expect(await stockOf("star")).toBe(3);
    expect(await stockOf("dog")).toBeNull();

    // Cancelling twice must not return the stock twice.
    await adminUpdateOrder(env, auth, order.id, { status: "cancelled" });
    expect(await stockOf("star")).toBe(3);

    await adminUpdateOrder(env, auth, order.id, { status: "verified" });
    expect(await stockOf("star")).toBe(1);

    // Moving between non-cancelled statuses leaves stock alone.
    await adminUpdateOrder(env, auth, order.id, { status: "picked_up" });
    expect(await stockOf("star")).toBe(1);
  });

  it("refuses to un-cancel when the stock has gone to someone else", async () => {
    const order = await placeOrder([{ itemId: "star", qty: 3 }]);
    const auth = await adminAuth();
    await adminUpdateOrder(env, auth, order.id, { status: "cancelled" });
    await placeOrder([{ itemId: "star", qty: 2 }]);

    const err = await rejection(adminUpdateOrder(env, auth, order.id, { status: "submitted" }));
    expect(err.status).toBe(409);
    expect(err.message).toMatch(/Not enough limited-edition stock/);
    expect(await stockOf("star")).toBe(1);
    const row = await env.DB.prepare("SELECT status FROM orders WHERE id = ?")
      .bind(order.id)
      .first<{ status: string }>();
    expect(row?.status).toBe("cancelled");
  });

  it("saves admin notes and rejects unknown statuses and orders", async () => {
    const order = await placeOrder([{ itemId: "dog", qty: 1 }]);
    const auth = await adminAuth();

    const updated = await adminUpdateOrder(env, auth, order.id, {
      status: "issue",
      adminNote: "Receipt shows $4",
    });
    expect(updated).toMatchObject({ status: "issue", adminNote: "Receipt shows $4" });

    expect(
      (await rejection(adminUpdateOrder(env, auth, order.id, { status: "lost" }))).status,
    ).toBe(400);
    expect(
      (await rejection(adminUpdateOrder(env, auth, "BXB-ZZZZZ", { status: "verified" }))).status,
    ).toBe(404);
  });
});

describe("admin items", () => {
  it("creates an item with a cleaned-up id and defaults", async () => {
    const items = await adminCreateItem(env, await adminAuth(), {
      id: "  Rainbow Unicorn! ",
      name: "Unicorn",
      priceCents: 2000,
      stock: 4,
    });
    expect(items.find((i) => i.id === "rainbow-unicorn")).toMatchObject({
      name: "Unicorn",
      priceCents: 2000,
      stock: 4,
      active: true,
    });
  });

  it("starts a new item at stock 0 (sold out) and never makes it unlimited", async () => {
    const auth = await adminAuth();
    let items = await adminCreateItem(env, auth, { id: "Pumpkin", stock: null });
    expect(items.find((i) => i.id === "pumpkin")?.stock).toBe(0);
    items = await adminUpdateItem(env, auth, "star", { stock: null });
    expect(items.find((i) => i.id === "star")?.stock).toBe(3);
  });

  it("edits only valid fields and can hide an item from the menu", async () => {
    const items = await adminUpdateItem(env, await adminAuth(), "dog", {
      name: "Puppy",
      priceCents: -5,
      tint: "red",
      stock: 2,
      active: false,
    });
    expect(items.find((i) => i.id === "dog")).toMatchObject({
      name: "Puppy",
      priceCents: 500,
      stock: 2,
      active: false,
    });
    expect((await getMenu(env)).items.map((i) => i.id)).not.toContain("dog");
    expect((await adminItems(env, await adminAuth())).map((i) => i.id)).toContain("dog");
  });

  it("stores an uploaded photo in R2 and serves it publicly", async () => {
    const auth = await adminAuth();
    const items = await adminUploadPhoto(
      env,
      auth,
      "dog",
      new File([new Uint8Array([9, 9])], "dog.jpg", { type: "image/jpeg" }),
    );
    const dog = items.find((i) => i.id === "dog")!;
    expect(dog.photoUrl).toMatch(/^\/api\/files\/photos\/dog-\d+\.jpg$/);
    const photo = await getPhoto(env, dog.photoUrl!.replace("/api/files/", ""));
    expect(photo.httpMetadata?.contentType).toBe("image/jpeg");

    const svg = new File(["<svg/>"], "x.svg", { type: "image/svg+xml" });
    expect((await rejection(adminUploadPhoto(env, auth, "dog", svg))).status).toBe(400);
  });
});

describe("admin settings", () => {
  it("saves known keys, ignores unknown ones and trims long values", async () => {
    const settings = await adminSaveSettings(env, await adminAuth(), {
      event_date: "Sat, Nov 21",
      orders_open: "0",
      announcement: "x".repeat(600),
      evil: "1",
      event_time: 5,
    });
    expect(settings).toMatchObject({
      event_date: "Sat, Nov 21",
      orders_open: "0",
      event_time: "6pm–8pm",
    });
    expect(settings.announcement).toHaveLength(500);
    expect(await env.DB.prepare("SELECT 1 FROM settings WHERE key = 'evil'").first()).toBeNull();

    const closed = await rejection(
      createOrder(env, orderForm({ lines: [{ itemId: "dog", qty: 1 }] }), background()),
    );
    expect(closed.status).toBe(409);
  });

  it("stores the Venmo handle without the @ or spaces, and refuses a bad one", async () => {
    const auth = await adminAuth();
    const before = await adminSaveSettings(env, auth, {});
    expect((await adminSaveSettings(env, auth, { venmo_handle: " @huhuwen " })).venmo_handle).toBe(
      "huhuwen",
    );
    expect((await adminSaveSettings(env, auth, { venmo_handle: "" })).venmo_handle).toBe("");

    const err = await rejection(
      adminSaveSettings(env, auth, { venmo_handle: "huhu wen", event_date: "Sun, Nov 22" }),
    );
    expect(err.status).toBe(400);
    expect(err.message).toMatch(/Venmo username/);
    // Nothing in a refused save is written.
    const settings = await adminSaveSettings(env, auth, {});
    expect(settings.venmo_handle).toBe("");
    expect(settings.event_date).toBe(before.event_date);
  });
});
