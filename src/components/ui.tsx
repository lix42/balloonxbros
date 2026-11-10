import { cn } from "cn";
import type { ComponentProps, ReactNode } from "react";
import { Link, type LinkProps } from "@tanstack/react-router";
import { buttonVariants } from "./ui/button";

export function Logo({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={(size * 40) / 34} viewBox="0 0 34 40" aria-hidden="true">
      <ellipse cx="12" cy="13" rx="9" ry="11" fill="#D93A31" />
      <ellipse cx="22" cy="15" rx="9" ry="11" fill="#2E6BE6" />
      <path
        d="M12 24 Q14 31 17 38 M22 26 Q20 32 17 38"
        stroke="#1B1F3B"
        strokeWidth="1.5"
        fill="none"
      />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="font-heading text-[22px] font-bold tracking-[-0.2px]">
      Balloon <span className="text-red-500">×</span> Bros
    </span>
  );
}

export function ArrowRight({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function ArrowLeft() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </svg>
  );
}

export function MegaphoneIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="text-yellow-300"
    >
      <path d="M3 11v2a1 1 0 0 0 1 1h3l6 5V5L7 10H4a1 1 0 0 0-1 1z" />
      <path d="M17 8a5 5 0 0 1 0 8" />
    </svg>
  );
}

export function WrenchIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0 text-accent-500"
    >
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}

export function UploadIcon() {
  return (
    <svg
      width="36"
      height="36"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="text-accent-500"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M17 8l-5-5-5 5" />
      <path d="M12 3v12" />
    </svg>
  );
}

/** Shown in the receipt dropzone once a file is chosen. */
export function CheckCircleIcon() {
  return (
    <svg
      width="36"
      height="36"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="text-accent-700"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12.5l2.7 2.7L16 9.8" />
    </svg>
  );
}

export function SiteHeader() {
  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-[640px] items-center justify-between gap-2 px-5 py-3.5">
        <Link
          to="/"
          className="flex items-center gap-2.5 text-ink no-underline hover:text-ink"
          aria-label="Balloon x Bros home"
        >
          <Logo />
          <Wordmark />
        </Link>
        <Link to="/order" className={buttonVariants({ variant: "pill" })}>
          Pre-order
        </Link>
      </div>
    </header>
  );
}

export function BackHeader({
  to,
  label,
  children,
}: {
  to: LinkProps["to"];
  label: string;
  children: ReactNode;
}) {
  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-[640px] items-center justify-start gap-2 py-3.5 pr-5 pl-3">
        <Link to={to} className={buttonVariants({ variant: "icon" })} aria-label={label}>
          <ArrowLeft />
        </Link>
        <span className="font-heading text-xl font-bold tracking-[-0.2px]">{children}</span>
      </div>
    </header>
  );
}

export function Loading() {
  return (
    <p className="p-10 text-center text-[13px] text-muted" role="status">
      Loading…
    </p>
  );
}

export function LoadError({ message, retry }: { message: string; retry: () => void }) {
  return (
    <div className="flex flex-col gap-2.5 px-5 py-4" role="alert">
      <ErrorBox>{message}</ErrorBox>
      <button
        type="button"
        className={buttonVariants({ variant: "ink", size: "lg" })}
        onClick={retry}
      >
        Try again
      </button>
    </div>
  );
}

/** Inline error message (form and load errors). */
export function ErrorBox({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("rounded-lg bg-red-100 px-3.5 py-3 text-sm font-bold text-red-900", className)}
      {...props}
    />
  );
}
