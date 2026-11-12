import { describe, expect, it } from "vite-plus/test";
import type { PublicOrder, Settings } from "../shared/types";
import { confirmationEmail, orderNotificationEmail } from "../worker/email";

const order: PublicOrder = {
  id: "BB-1234",
  name: "Ada",
  totalCents: 500,
  paymentMethod: "school",
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

  it("names the payment the buyer made", () => {
    const school = confirmationEmail(order, settings, "https://balloonxbros.com");
    expect(school.html).toContain("check your donation receipt");
    expect(school.text).toContain("Donated: $5");

    const venmo = confirmationEmail(
      { ...order, paymentMethod: "venmo" },
      settings,
      "https://balloonxbros.com",
    );
    expect(venmo.html).toContain("check your Venmo payment");
    expect(venmo.html).toContain(">Paid on Venmo</td>");
    expect(venmo.text).toContain("Paid on Venmo: $5");
  });
});

describe("order notification email", () => {
  const buyer = { email: "ada@example.com", phone: "(425) 555-0100" };
  const noted: PublicOrder = {
    ...order,
    name: "Ada <Lovelace>",
    lines: [{ ...order.lines[0], qty: 2, note: "red & blue" }],
  };

  it("gives the buyer's contact, the balloons and the admin link", () => {
    const { subject, html, text } = orderNotificationEmail(
      noted,
      { ...buyer, payment: { method: "school" } },
      "https://balloonxbros.com",
    );
    expect(subject).toBe("New order BB-1234 — $5 (school donation)");
    expect(html).toContain("<strong>Ada &#60;Lovelace&#62;</strong>");
    expect(html).toContain('href="mailto:ada@example.com"');
    expect(html).toContain('href="tel:+14255550100"');
    expect(html).toContain("<li>2 × Balloon Dog (red &#38; blue)</li>");
    expect(html).toContain('href="https://balloonxbros.com/admin"');
    expect(text).toContain("2 × Balloon Dog (red & blue)");
    expect(text).toContain("Donated to the school. The receipt is in admin.");
    expect(text).toContain("Admin: https://balloonxbros.com/admin");
  });

  it("names the Venmo username to look for", () => {
    const { subject, text } = orderNotificationEmail(
      order,
      { ...buyer, payment: { method: "venmo", venmoUsername: "ada-l" } },
      "https://balloonxbros.com",
    );
    expect(subject).toBe("New order BB-1234 — $5 (Venmo)");
    expect(text).toContain("Paid on Venmo as @ada-l. Check that it came in.");
  });
});
