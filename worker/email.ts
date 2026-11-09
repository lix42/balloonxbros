import { formatCents, type PublicOrder, type Settings } from "../shared/types";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export function confirmationEmail(order: PublicOrder, s: Settings, siteUrl: string) {
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
<p style="margin:0 0 16px;line-height:1.5;color:#454B6B">Order <strong style="color:#1B1F3B">${order.id}</strong>. We'll check your donation receipt and have your balloons ready. If anything doesn't match, we'll reach out by email or phone.</p>
<table style="width:100%;border-collapse:collapse;font-size:15px">${rows}
<tr><td style="padding:10px 0 0;border-top:1px solid #E2E7F5;font-weight:800">Donated</td><td style="padding:10px 0 0;border-top:1px solid #E2E7F5;text-align:right;font-weight:800">${formatCents(order.totalCents)}</td></tr></table>
<p style="margin:18px 0 0;line-height:1.5"><strong>Pick up:</strong> ${esc(s.event_date)}, ${esc(s.event_time)} at ${esc(s.event_place)}. Just give your name at the Balloon x Bros table.</p>
</div>
<p style="font-size:13px;color:#545A78;line-height:1.5">Every dollar goes to ${esc(s.school_name)}. Questions? Reply to this email or write to ${esc(s.contact_email)}.<br><a href="${esc(siteUrl)}" style="color:#2257C9">${esc(siteUrl.replace(/^https?:\/\//, ""))}</a></p>
</div></body></html>`;

  const text = [
    `Thanks, ${order.name}! We got your pre-order ${order.id}.`,
    "",
    ...order.lines.map((l) => `${l.qty} x ${l.name}${l.note ? ` (${l.note})` : ""}`),
    `Donated: ${formatCents(order.totalCents)}`,
    "",
    `Pick up: ${s.event_date}, ${s.event_time} at ${s.event_place}.`,
    `Questions: ${s.contact_email}`,
  ].join("\n");

  return { subject: `Your Balloon x Bros pre-order ${order.id}`, html, text };
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
