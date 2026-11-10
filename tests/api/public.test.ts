import { env } from "cloudflare:workers";
import { beforeEach, describe, expect, it } from "vite-plus/test";
import { createOrder, getMenu, getPhoto } from "../../worker/service";
import {
  background,
  count,
  fileKeys,
  orderForm,
  receiptFile,
  rejection,
  reset,
  stockOf,
} from "./helpers";

beforeEach(reset);

const submit = (form: FormData, bg = background()) => createOrder(env, form, bg);

describe("getMenu", () => {
  it("lists active items in sort order with the settings", async () => {
    const menu = await getMenu(env);
    expect(menu.items.map((i) => i.id)).toEqual(["dog", "sword", "star", "gone"]);
    expect(menu.settings.school_name).toBe("Kirkland Middle School (KIMS)");
    expect(menu.settings.orders_open).toBe("1");
    expect(menu.settings.event_place).toBe("Sno-King Ice Arena, Kirkland");
    expect(menu.settings.announcement).toContain("pickup at Sno-King Ice Arena, Kirkland on 11/13");
    expect(menu.settings.event_address).toBe("14326 124th Ave NE, Kirkland, WA 98034");
    expect(menu.settings.announcement).toMatch(/^Hi! .*\n-Sky and Ocean$/s);
    expect(menu.settings).not.toHaveProperty("cutoff");
    expect(menu.settings.donation_url).toBe(
      "https://wa-lakewashington-lite.intouchreceipting.com/default",
    );
  });
});

describe("createOrder", () => {
  it("creates the order, prices it from the database and takes limited stock", async () => {
    const { order } = await submit(
      orderForm({
        lines: [
          { itemId: "dog", qty: 2, note: "blue please" },
          { itemId: "star", qty: 1 },
          { itemId: "dog", qty: 1 },
        ],
      }),
    );
    expect(order.id).toMatch(/^BXB-[2-9A-HJKMNP-Z]{5}$/);
    expect(order.status).toBe("submitted");
    expect(order.totalCents).toBe(3 * 500 + 1500);
    expect(order.lines).toEqual([
      { itemId: "dog", name: "Balloon Dog", unitPriceCents: 500, qty: 3, note: "blue please" },
      { itemId: "star", name: "Gold Star", unitPriceCents: 1500, qty: 1, note: null },
    ]);

    expect(await stockOf("star")).toBe(2);
    expect(await stockOf("dog")).toBeNull();
    const row = await env.DB.prepare(
      "SELECT email, receipt_key, receipt_type FROM orders WHERE id = ?",
    )
      .bind(order.id)
      .first<{ email: string; receipt_key: string; receipt_type: string }>();
    expect(row).toEqual({
      email: "ada@example.com",
      receipt_key: `receipts/${order.id}.png`,
      receipt_type: "image/png",
    });
    expect(await fileKeys("receipts/")).toEqual([`receipts/${order.id}.png`]);
    expect(await count("order_items")).toBe(2);
  });

  it("refuses orders while pre-orders are closed", async () => {
    await env.DB.prepare("UPDATE settings SET value = '0' WHERE key = 'orders_open'").run();
    const err = await rejection(submit(orderForm({ lines: [{ itemId: "dog", qty: 1 }] })));
    expect(err.status).toBe(409);
    expect(err.message).toMatch(/closed/);
    expect(await count("orders")).toBe(0);
  });

  it("refuses inactive and unknown items", async () => {
    for (const itemId of ["retired", "nope"]) {
      const err = await rejection(submit(orderForm({ lines: [{ itemId, qty: 1 }] })));
      expect(err.status).toBe(409);
      expect(err.message).toMatch(/no longer available/);
    }
    expect(await count("orders")).toBe(0);
  });

  it("refuses more than the stock left, naming the item", async () => {
    let err = await rejection(submit(orderForm({ lines: [{ itemId: "star", qty: 4 }] })));
    expect(err).toEqual({ status: 409, message: "Sorry, only 3 Gold Star left." });

    err = await rejection(submit(orderForm({ lines: [{ itemId: "gone", qty: 1 }] })));
    expect(err).toEqual({ status: 409, message: "Sorry, Sold Out Star just sold out." });
    expect(await stockOf("star")).toBe(3);
    expect(await count("orders")).toBe(0);
  });

  it("rolls back the whole order when stock runs out mid-checkout", async () => {
    // Another buyer takes the last stars between our stock check and our write.
    await env.DB.prepare(
      "CREATE TRIGGER steal_stock BEFORE INSERT ON orders BEGIN UPDATE items SET stock = 0 WHERE id = 'star'; END",
    ).run();
    const bg = background();
    const err = await rejection(
      submit(
        orderForm({
          lines: [
            { itemId: "dog", qty: 1 },
            { itemId: "star", qty: 1 },
          ],
        }),
        bg,
      ),
    );
    expect(err.status).toBe(409);
    expect(err.message).toMatch(/just sold out/);
    expect(await count("orders")).toBe(0);
    expect(await count("order_items")).toBe(0);
    await bg.settled(); // the receipt is deleted in the background
    expect(await fileKeys("receipts/")).toEqual([]);
  });

  it("requires a receipt that is an image or PDF", async () => {
    let err = await rejection(submit(orderForm({ lines: [{ itemId: "dog", qty: 1 }] }, null)));
    expect(err.status).toBe(400);
    expect(err.message).toMatch(/attach your donation receipt/);

    err = await rejection(
      submit(orderForm({ lines: [{ itemId: "dog", qty: 1 }] }, receiptFile("text/html"))),
    );
    expect(err.status).toBe(400);
    expect(err.message).toMatch(/image .* or a PDF/);
    expect(await count("orders")).toBe(0);
    expect(await fileKeys()).toEqual([]);
  });

  it("rejects malformed submissions", async () => {
    const form = new FormData();
    form.set("order", "{not json");
    form.set("receipt", receiptFile());
    expect(await rejection(submit(form))).toEqual({ status: 400, message: "Invalid order." });

    const err = await rejection(
      submit(orderForm({ email: "nope", lines: [{ itemId: "dog", qty: 1 }] })),
    );
    expect(err.status).toBe(400);
    expect(err.message).toMatch(/valid email/);
  });
});

describe("getPhoto", () => {
  it("serves item photos but never receipts", async () => {
    await env.FILES.put("photos/dog-1.png", new Uint8Array([1, 2, 3]), {
      httpMetadata: { contentType: "image/png" },
    });
    await env.FILES.put("receipts/BXB-AAAAA.png", new Uint8Array([4]), {
      httpMetadata: { contentType: "image/png" },
    });

    const photo = await getPhoto(env, "photos/dog-1.png");
    expect(photo.httpMetadata?.contentType).toBe("image/png");
    expect(new Uint8Array(await photo.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]));

    for (const key of [
      "receipts/BXB-AAAAA.png",
      "photos/../receipts/BXB-AAAAA.png",
      "photos/missing.png",
    ]) {
      expect((await rejection(getPhoto(env, key))).status).toBe(404);
    }
  });
});
