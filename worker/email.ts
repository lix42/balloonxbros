import { EVENT_MAP, eventMapUrl } from "../shared/place";
import { usPhoneDigits } from "../shared/phone";
import { formatCents, type PaymentInput, type PublicOrder, type Settings } from "../shared/types";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export function confirmationEmail(order: PublicOrder, s: Settings, siteUrl: string) {
  const mapUrl = eventMapUrl(s);
  const address = s.event_address ? `, ${s.event_address}` : "";
  const mapImg = new URL(EVENT_MAP.path, siteUrl).href;
  const venmo = order.paymentMethod === "venmo";
  const checking = venmo ? "your Venmo payment" : "your donation receipt";
  const paidLabel = venmo ? "Paid on Venmo" : "Donated";
  const rows = order.lines
    .map(
      (l) =>
        `<tr><td style="padding:6px 0">${l.qty} × ${esc(l.name)}${
          l.note ? `<br><span style="color:#545A78;font-size:13px">${esc(l.note)}</span>` : ""
        }</td><td style="padding:6px 0;text-align:right">${formatCents(l.qty * l.unitPriceCents)}</td></tr>`,
    )
    .join("");

  const html = `<!doctype html><html><body style="margin:0;background:#F4F7FF;font-family:Nunito,Arial,sans-serif;color:#1B1F3B">
<div style="max-width:520px;margin:0 auto;padding:28px 20px">
<p style="font-size:22px;font-weight:700;margin:0 0 16px">Balloon <span style="color:#D93A31">×</span> Bros</p>
<div style="background:#fff;border-radius:18px;padding:22px;border:1px solid #E2E7F5">
<h1 style="font-size:24px;margin:0 0 8px">Thanks, ${esc(order.name)}! We got your pre-order.</h1>
<p style="margin:0 0 16px;line-height:1.5;color:#454B6B">Order <strong style="color:#1B1F3B">${order.id}</strong>. We'll check ${checking} and have your balloons ready. If anything doesn't match, we'll reach out by email or phone.</p>
<table style="width:100%;border-collapse:collapse;font-size:15px">${rows}
<tr><td style="padding:10px 0 0;border-top:1px solid #E2E7F5;font-weight:800">${paidLabel}</td><td style="padding:10px 0 0;border-top:1px solid #E2E7F5;text-align:right;font-weight:800">${formatCents(order.totalCents)}</td></tr></table>
<p style="margin:18px 0 0;line-height:1.5"><strong>Pick up:</strong> ${esc(s.event_date)}, ${esc(s.event_time)} at <a href="${esc(mapUrl)}" style="color:#2257C9">${esc(s.event_place)}</a>${esc(address)}. Just give your name at the Balloon x Bros table.</p>
<a href="${esc(mapUrl)}" style="display:block;margin:14px 0 0"><img src="${esc(mapImg)}" width="476" alt="Map to ${esc(s.event_place)}" style="display:block;width:100%;max-width:476px;height:auto;border:1px solid #E2E7F5;border-radius:12px"></a>
<p style="margin:4px 0 0;font-size:11px;color:#545A78;text-align:right">${EVENT_MAP.credit}</p>
</div>
<p style="font-size:13px;color:#545A78;line-height:1.5">Every dollar goes to ${esc(s.school_name)}. Questions? Reply to this email or write to ${esc(s.contact_email)}.<br><a href="${esc(siteUrl)}" style="color:#2257C9">${esc(siteUrl.replace(/^https?:\/\//, ""))}</a></p>
</div></body></html>`;

  const text = [
    `Thanks, ${order.name}! We got your pre-order ${order.id}.`,
    "",
    ...order.lines.map((l) => `${l.qty} x ${l.name}${l.note ? ` (${l.note})` : ""}`),
    `${paidLabel}: ${formatCents(order.totalCents)}`,
    "",
    `Pick up: ${s.event_date}, ${s.event_time} at ${s.event_place}${address}.`,
    `Map: ${mapUrl}`,
    `Questions: ${s.contact_email}`,
  ].join("\n");

  return { subject: `Your Balloon x Bros pre-order ${order.id}`, html, text };
}

/** How to reach the buyer and check their payment: what an order adds to its PublicOrder. */
export interface OrderContact {
  email: string;
  phone: string;
  payment: PaymentInput;
}

/** The "new order" note to the team (contact_email), sent beside the buyer's confirmation. */
export function orderNotificationEmail(order: PublicOrder, buyer: OrderContact, siteUrl: string) {
  const venmo = buyer.payment.method === "venmo" ? buyer.payment.venmoUsername : null;
  const payment = venmo
    ? `Paid on Venmo as @${venmo}. Check that it came in.`
    : "Donated to the school. The receipt is in admin.";
  const adminUrl = new URL("/admin", siteUrl).href;
  const lineText = (l: PublicOrder["lines"][number]) =>
    `${l.qty} × ${l.name}${l.note ? ` (${l.note})` : ""}`;

  const html = `<!doctype html><html><body style="margin:0;font-family:Nunito,Arial,sans-serif;color:#1B1F3B">
<div style="max-width:520px;margin:0 auto;padding:20px">
<h1 style="font-size:20px;margin:0 0 12px">New order ${order.id}: ${formatCents(order.totalCents)}</h1>
<p style="margin:0 0 12px;line-height:1.5"><strong>${esc(order.name)}</strong><br>
<a href="mailto:${esc(buyer.email)}" style="color:#2257C9">${esc(buyer.email)}</a><br>
<a href="tel:+1${usPhoneDigits(buyer.phone)}" style="color:#2257C9">${esc(buyer.phone)}</a></p>
<ul style="margin:0 0 12px;padding-left:20px;line-height:1.5">${order.lines
    .map((l) => `<li>${esc(lineText(l))}</li>`)
    .join("")}</ul>
<p style="margin:0 0 12px;line-height:1.5">${esc(payment)}</p>
<p style="margin:0"><a href="${esc(adminUrl)}" style="color:#2257C9">Open admin</a> · Reply to write to ${esc(order.name)}.</p>
</div></body></html>`;

  const text = [
    `New order ${order.id}: ${formatCents(order.totalCents)}`,
    "",
    order.name,
    buyer.email,
    buyer.phone,
    "",
    ...order.lines.map(lineText),
    "",
    payment,
    `Admin: ${adminUrl}`,
  ].join("\n");

  const how = venmo ? "Venmo" : "school donation";
  return {
    subject: `New order ${order.id} — ${formatCents(order.totalCents)} (${how})`,
    html,
    text,
  };
}

/** Sends via Resend. Returns false (without throwing) when not configured or on failure. */
export async function sendEmail(
  env: Env,
  to: string,
  replyTo: string,
  msg: { subject: string; html: string; text: string },
): Promise<boolean> {
  if (!env.RESEND_API_KEY) return false;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: env.EMAIL_FROM, to: [to], reply_to: replyTo, ...msg }),
  });
  if (!res.ok) {
    console.error("resend failed", res.status, await res.text());
    return false;
  }
  return true;
}
