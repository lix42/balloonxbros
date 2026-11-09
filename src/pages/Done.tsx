import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import type { PublicOrder, Settings } from "../../shared/types";
import { useStore } from "../store";
import { LAST_ORDER_KEY } from "./Order";

function readLast(code: string): { order: PublicOrder; settings: Settings } | null {
  try {
    const raw = sessionStorage.getItem(LAST_ORDER_KEY);
    const data = raw ? JSON.parse(raw) : null;
    return data?.order?.id === code ? data : null;
  } catch {
    return null;
  }
}

export function Done({ code }: { code: string }) {
  const { settings: liveSettings } = useStore();
  // sessionStorage exists only in the browser: render the generic page on the
  // server, then fill in this order's details once mounted.
  const [last, setLast] = useState<ReturnType<typeof readLast>>(null);
  useEffect(() => setLast(readLast(code)), [code]);
  const settings = last?.settings ?? liveSettings;
  const order = last?.order;

  return (
    <main className="page section stack" style={{ gap: 22, paddingTop: 56, paddingBottom: 32 }}>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <svg width="150" height="170" viewBox="0 0 150 170" aria-hidden="true">
          <path
            d="M48 78 Q60 120 75 166 M102 74 Q90 120 75 166 M75 70 L75 166"
            stroke="#1B1F3B"
            strokeWidth="2"
            fill="none"
          />
          <ellipse cx="46" cy="52" rx="28" ry="33" fill="#D93A31" />
          <ellipse cx="104" cy="48" rx="28" ry="33" fill="#2E6BE6" />
          <ellipse cx="75" cy="38" rx="28" ry="33" fill="#F2A900" />
          <path
            d="M62 38 l9 9 l17 -18"
            stroke="#1B1F3B"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>

      <div className="stack gap-10" style={{ textAlign: "center" }}>
        <h1 className="h1 sm">Order received!</h1>
        <p className="lede">
          Thank you for supporting {settings.school_name}. We'll check your receipt and email you a
          confirmation.
        </p>
      </div>

      <div className="card stack gap-14" style={{ borderRadius: 20, padding: 18 }}>
        <div className="kv">
          <span>Order</span>
          <span>{code}</span>
        </div>
        {order && (
          <div className="kv">
            <span>Balloons</span>
            <span>{order.lines.map((l) => `${l.qty} × ${l.name}`).join(" · ")}</span>
          </div>
        )}
        {settings && (
          <>
            <div className="kv">
              <span>Pick up</span>
              <span>
                {settings.event_date}, {settings.event_time}
              </span>
            </div>
            <div className="kv">
              <span>Where</span>
              <span>{settings.event_place}</span>
            </div>
          </>
        )}
      </div>

      <div className="card-yellow">
        Bring a friend! We'll also be twisting balloons on the spot at the event.
      </div>

      <Link to="/" className="btn btn-ink btn-block" style={{ marginTop: "auto" }}>
        Back to home
      </Link>
    </main>
  );
}
