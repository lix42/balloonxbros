import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { cn } from "cn";
import { EVENT_MAP, eventMapUrl } from "../../shared/place";
import type { PublicOrder, Settings } from "../../shared/types";
import { buttonVariants } from "../components/ui/button";
import { useStore } from "../store";
import { LAST_ORDER_KEY } from "./Order";

const kv = "flex justify-between gap-3 text-[15px]";
const kvKey = "font-bold text-muted";
const kvValue = "text-right font-extrabold";

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
    <main className="mx-auto flex min-h-screen w-full max-w-[640px] flex-col gap-[22px] px-5 pt-14 pb-8">
      <div className="flex justify-center">
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

      <div className="flex flex-col gap-2.5 text-center">
        <h1 className="text-[34px] leading-[1.05] font-bold tracking-[-0.5px]">Order received!</h1>
        <p className="text-base text-ink-2">
          Thank you for supporting {settings.school_name}. We'll check your receipt and email you a
          confirmation.
        </p>
      </div>

      <div className="flex flex-col gap-3.5 rounded-[20px] border border-line bg-surface p-[18px]">
        <div className={kv}>
          <span className={kvKey}>Order</span>
          <span className={kvValue}>{code}</span>
        </div>
        {order && (
          <div className={kv}>
            <span className={kvKey}>Balloons</span>
            <span className={kvValue}>
              {order.lines.map((l) => `${l.qty} × ${l.name}`).join(" · ")}
            </span>
          </div>
        )}
        {settings && (
          <>
            <div className={kv}>
              <span className={kvKey}>Pick up</span>
              <span className={kvValue}>
                {settings.event_date}, {settings.event_time}
              </span>
            </div>
            <div className={kv}>
              <span className={kvKey}>Where</span>
              <a
                href={eventMapUrl(settings)}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(kvValue, "flex flex-col")}
              >
                {settings.event_place}
                {settings.event_address && (
                  <span className="text-[13px] font-bold">{settings.event_address}</span>
                )}
              </a>
            </div>
            <a
              href={eventMapUrl(settings)}
              target="_blank"
              rel="noopener noreferrer"
              className="block overflow-hidden rounded-xl border border-line"
            >
              <img
                src={EVENT_MAP.path}
                width={EVENT_MAP.width}
                height={EVENT_MAP.height}
                alt={`Map to ${settings.event_place}. Opens Google Maps.`}
                className="block h-auto w-full"
              />
              <span className="block border-t border-line bg-white px-2.5 py-1 text-right text-[11px] font-semibold text-muted">
                {EVENT_MAP.credit}
              </span>
            </a>
          </>
        )}
      </div>

      <div className="rounded-[16px] bg-yellow-100 px-4 py-3.5 text-[14px] text-yellow-900">
        Bring a friend! We'll also be twisting balloons on the spot at the event.
      </div>

      <Link
        to="/"
        className={cn(buttonVariants({ variant: "ink", size: "lg", block: true }), "mt-auto")}
      >
        Back to home
      </Link>
    </main>
  );
}
