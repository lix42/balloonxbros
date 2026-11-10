import { describe, expect, it } from "vite-plus/test";
import type { PublicOrder, Settings } from "../shared/types";
import { confirmationEmail } from "../worker/email";

const order: PublicOrder = {
  id: "BB-1234",
  name: "Ada",
  totalCents: 500,
  status: "submitted",
  lines: [{ itemId: "dog", name: "Balloon Dog", unitPriceCents: 500, qty: 1, note: null }],
  createdAt: "2026-11-09T00:00:00Z",
};

const settings = {
  school_name: "Kirkland Middle School (KIMS)",
  event_date: "Fri, Nov 13",
  event_time: "6pm–8pm",
  event_place: "Kingsgate Skating Rink",
  event_address: "14326 124th Ave NE, Kirkland, WA 98034",
  contact_email: "hello@balloonxbros.com",
} as Settings;

describe("confirmation email", () => {
  it("links the pickup place to Google Maps with a map preview", () => {
    const { html, text } = confirmationEmail(order, settings, "https://balloonxbros.com");
    const maps =
      "https://www.google.com/maps/search/?api=1&#38;query=14326%20124th%20Ave%20NE%2C%20Kirkland%2C%20WA%2098034";
    expect(html).toContain(
      `<a href="${maps}" style="color:#2257C9">Kingsgate Skating Rink</a>, 14326 124th Ave NE, Kirkland, WA 98034.`,
    );
    expect(html).toContain("Map data ©2026 Google");
    expect(html).toMatch(
      new RegExp(
        `<a href="${maps.replace(/[?.]/g, "\\$&")}"[^>]*><img src="https://balloonxbros.com/event-map.jpg"`,
      ),
    );
    expect(text).toContain(
      "Map: https://www.google.com/maps/search/?api=1&query=14326%20124th%20Ave%20NE%2C%20Kirkland%2C%20WA%2098034",
    );
  });
});
