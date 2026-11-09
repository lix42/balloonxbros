import type { ReactNode } from "react";
import { Link, type LinkProps } from "@tanstack/react-router";

export function Logo({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={(size * 40) / 34} viewBox="0 0 34 40" aria-hidden="true">
      <ellipse cx="12" cy="13" rx="9" ry="11" fill="#D93A31" />
      <ellipse cx="22" cy="15" rx="9" ry="11" fill="#2E6BE6" />
      <path d="M12 24 Q14 31 17 38 M22 26 Q20 32 17 38" stroke="#1B1F3B" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="wordmark">
      Balloon <span className="x">×</span> Bros
    </span>
  );
}

export function ArrowRight({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function ArrowLeft() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </svg>
  );
}

export function MegaphoneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFD166" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 11v2a1 1 0 0 0 1 1h3l6 5V5L7 10H4a1 1 0 0 0-1 1z" />
      <path d="M17 8a5 5 0 0 1 0 8" />
    </svg>
  );
}

export function WrenchIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2E6BE6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}

export function UploadIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#2E6BE6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M17 8l-5-5-5 5" />
      <path d="M12 3v12" />
    </svg>
  );
}

export function SiteHeader() {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link to="/" className="brand" aria-label="Balloon x Bros home">
          <Logo />
          <Wordmark />
        </Link>
        <Link to="/order" className="pill">
          Pre-order
        </Link>
      </div>
    </header>
  );
}

export function BackHeader({ to, label, children }: { to: LinkProps["to"]; label: string; children: ReactNode }) {
  return (
    <header className="topbar">
      <div className="topbar-inner back">
        <Link to={to} className="icon-btn" aria-label={label}>
          <ArrowLeft />
        </Link>
        <span className="wordmark" style={{ fontSize: 20 }}>
          {children}
        </span>
      </div>
    </header>
  );
}

export function Loading() {
  return (
    <p className="small" style={{ padding: 40, textAlign: "center" }} role="status">
      Loading…
    </p>
  );
}

export function LoadError({ message, retry }: { message: string; retry: () => void }) {
  return (
    <div className="section stack gap-10" role="alert">
      <div className="error">{message}</div>
      <button type="button" className="btn btn-ink" onClick={retry}>
        Try again
      </button>
    </div>
  );
}
