import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  formatCents,
  type AdminOrder,
  type Item,
  type OrderStatus,
  type Settings,
} from "../../shared/types";
import { ApiError, api } from "../api";
import { GLYPH_KEYS, ItemArt } from "../components/Glyph";
import { Logo } from "../components/ui";

type Tab = "orders" | "menu" | "event";

const STATUS_LABEL: Record<OrderStatus, string> = {
  submitted: "New",
  issue: "Receipt issue",
  verified: "Verified",
  picked_up: "Picked up",
  cancelled: "Cancelled",
};

export function Admin() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>("orders");

  useEffect(() => {
    api.admin.me().then(() => setAuthed(true), () => setAuthed(false));
  }, []);

  if (authed === null) return null;
  if (!authed) return <Login onDone={() => setAuthed(true)} />;

  return (
    <div className="admin">
      <header className="topbar">
        <div className="topbar-inner">
          <span className="brand"><Logo size={28} /><span className="wordmark" style={{ fontSize: 19 }}>Admin</span></span>
          <button
            type="button"
            className="pill"
            style={{ background: "#fff", cursor: "pointer" }}
            onClick={() => api.admin.logout().finally(() => setAuthed(false))}
          >
            Log out
          </button>
        </div>
      </header>
      <main className="page section stack gap-14">
        <div className="tabs" role="toolbar" aria-label="Sections">
          {(["orders", "menu", "event"] as Tab[]).map((t) => (
            <button key={t} type="button" className="tab" aria-pressed={tab === t} onClick={() => setTab(t)}>
              {t === "orders" ? "Orders" : t === "menu" ? "Balloons" : "Event"}
            </button>
          ))}
        </div>
        {tab === "orders" && <Orders onAuthLost={() => setAuthed(false)} />}
        {tab === "menu" && <Menu />}
        {tab === "event" && <EventSettings />}
      </main>
    </div>
  );
}

function Login({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.admin.login(password);
      onDone();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="page section stack gap-14" style={{ maxWidth: 420, paddingTop: 80 }}>
      <Logo size={40} />
      <h1 className="h1 sm">Balloon x Bros admin</h1>
      <form className="stack gap-14" onSubmit={submit}>
        <label className="field">
          Password
          <input className="input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {error && <div className="error" role="alert">{error}</div>}
        <button className="btn btn-ink" disabled={busy}>{busy ? "Checking…" : "Log in"}</button>
      </form>
    </main>
  );
}

// ---------- orders ----------

function Orders({ onAuthLost }: { onAuthLost: () => void }) {
  const [orders, setOrders] = useState<AdminOrder[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [q, setQ] = useState("");

  const load = useCallback(() => {
    api.admin.orders().then(
      (r) => setOrders(r.orders),
      (e) => (e instanceof ApiError && e.status === 401 ? onAuthLost() : setError(e.message)),
    );
  }, [onAuthLost]);
  useEffect(load, [load]);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (orders ?? []).filter(
      (o) =>
        (filter === "all" || o.status === filter) &&
        (!needle || `${o.id} ${o.name} ${o.email} ${o.phone}`.toLowerCase().includes(needle)),
    );
  }, [orders, filter, q]);

  const totals = useMemo(() => {
    const live = (orders ?? []).filter((o) => o.status !== "cancelled");
    return {
      count: live.length,
      balloons: live.reduce((n, o) => n + o.lines.reduce((m, l) => m + l.qty, 0), 0),
      cents: live.reduce((n, o) => n + o.totalCents, 0),
    };
  }, [orders]);

  // Pickup list: balloons still to make (submitted + verified).
  const toMake = useMemo(() => {
    const m = new Map<string, number>();
    for (const o of orders ?? []) {
      if (o.status === "picked_up" || o.status === "cancelled") continue;
      for (const l of o.lines) m.set(l.name, (m.get(l.name) ?? 0) + l.qty);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [orders]);

  const update = async (id: string, patch: { status?: OrderStatus; adminNote?: string }) => {
    try {
      const { order } = await api.admin.updateOrder(id, patch);
      setOrders((os) => os?.map((o) => (o.id === id ? order : o)) ?? null);
    } catch (e) {
      alertError(e);
    }
  };

  if (error) return <div className="error">{error}</div>;
  if (!orders) return <p className="small">Loading orders…</p>;

  return (
    <div className="stack gap-14">
      <div className="info-tiles">
        <div className="info-tile"><span className="label">Orders</span><strong>{totals.count}</strong></div>
        <div className="info-tile"><span className="label">Balloons</span><strong>{totals.balloons}</strong></div>
        <div className="info-tile"><span className="label">Raised</span><strong>{formatCents(totals.cents)}</strong></div>
      </div>

      {toMake.length > 0 && (
        <details className="card">
          <summary style={{ fontWeight: 800, cursor: "pointer", minHeight: 28 }}>Still to make</summary>
          <ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>
            {toMake.map(([name, n]) => <li key={name}>{n} × {name}</li>)}
          </ul>
        </details>
      )}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <input className="input sm" style={{ flex: "1 1 200px" }} placeholder="Search name, email, phone, code" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search orders" />
        <select className="input sm" style={{ width: "auto" }} value={filter} onChange={(e) => setFilter(e.target.value as OrderStatus | "all")} aria-label="Filter by status">
          <option value="all">All statuses</option>
          {(Object.keys(STATUS_LABEL) as OrderStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
        <button type="button" className="tab" onClick={load}>Refresh</button>
      </div>

      {shown.length === 0 && <p className="small">No orders yet.</p>}
      {shown.map((o) => <OrderCard key={o.id} order={o} onUpdate={update} />)}
    </div>
  );
}

function OrderCard({ order: o, onUpdate }: { order: AdminOrder; onUpdate: (id: string, p: { status?: OrderStatus; adminNote?: string }) => void }) {
  const [note, setNote] = useState(o.adminNote ?? "");
  const next: { label: string; status: OrderStatus }[] =
    o.status === "submitted"
      ? [
          { label: "Mark verified", status: "verified" },
          { label: "Receipt issue", status: "issue" },
          { label: "Cancel", status: "cancelled" },
        ]
      : o.status === "issue"
        ? [
            { label: "Mark verified", status: "verified" },
            { label: "Back to new", status: "submitted" },
            { label: "Cancel", status: "cancelled" },
          ]
      : o.status === "verified"
        ? [{ label: "Picked up", status: "picked_up" }, { label: "Back to new", status: "submitted" }]
        : o.status === "picked_up"
          ? [{ label: "Undo pickup", status: "verified" }]
          : [{ label: "Restore", status: "submitted" }];

  return (
    <article className="card stack gap-10">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <strong style={{ fontSize: 17 }}>{o.name}</strong>
        <span className={`status ${o.status}`}>{STATUS_LABEL[o.status]}</span>
      </div>
      <div className="small">
        {o.id} · {new Date(o.createdAt).toLocaleString()} ·{" "}
        <a href={`mailto:${o.email}`}>{o.email}</a> · <a href={`tel:${o.phone}`}>{o.phone}</a>
        {!o.emailSent && " · email not sent"}
      </div>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        {o.lines.map((l) => (
          <li key={l.itemId}>
            {l.qty} × {l.name}
            {l.note && <span className="small"> — {l.note}</span>}
          </li>
        ))}
      </ul>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ marginRight: "auto" }}>
          <span className="small">Receipt should show </span>
          <strong>{formatCents(o.totalCents)}</strong>
        </span>
        <a className="tab" style={{ display: "inline-flex", alignItems: "center", textDecoration: "none", color: "var(--ink)" }} href={o.receiptUrl} target="_blank" rel="noreferrer">
          View receipt
        </a>
        {next.map((n) => (
          <button key={n.status} type="button" className="tab" onClick={() => onUpdate(o.id, { status: n.status })}>
            {n.label}
          </button>
        ))}
      </div>
      {o.status === "issue" && (
        <div className="card-yellow">
          Contact {o.name.split(" ")[0]} about the receipt: <a href={`mailto:${o.email}?subject=${encodeURIComponent(`Your Balloon x Bros pre-order ${o.id}`)}`}>email</a> or{" "}
          <a href={`tel:${o.phone}`}>call {o.phone}</a>. Note what you found below.
        </div>
      )}
      <input
        className="input sm"
        placeholder="Private note (e.g. receipt amount checked)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onBlur={() => note !== (o.adminNote ?? "") && onUpdate(o.id, { adminNote: note })}
        aria-label={`Note for order ${o.id}`}
      />
    </article>
  );
}

// ---------- menu ----------

function Menu() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [newId, setNewId] = useState("");
  useEffect(() => {
    api.admin.items().then((r) => setItems(r.items), alertError);
  }, []);
  if (!items) return <p className="small">Loading balloons…</p>;

  const save = (id: string, patch: Partial<Item>) =>
    api.admin.updateItem(id, patch).then((r) => setItems(r.items), alertError);

  return (
    <div className="stack gap-14">
      <p className="small">Changes save when you leave a field. Leave stock empty for unlimited (regular menu).</p>
      {items.map((i) => <ItemEditor key={i.id} item={i} onSave={save} onItems={setItems} />)}
      <form
        className="card"
        style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
        onSubmit={(e) => {
          e.preventDefault();
          if (!newId.trim()) return;
          api.admin.createItem({ id: newId, name: newId }).then((r) => {
            setItems(r.items);
            setNewId("");
          }, alertError);
        }}
      >
        <input className="input sm" style={{ flex: "1 1 200px" }} placeholder="New balloon name" value={newId} onChange={(e) => setNewId(e.target.value)} aria-label="New balloon name" />
        <button className="tab">Add balloon</button>
      </form>
    </div>
  );
}

function ItemEditor({ item, onSave, onItems }: { item: Item; onSave: (id: string, p: Partial<Item>) => void; onItems: (i: Item[]) => void }) {
  const [name, setName] = useState(item.name);
  const [price, setPrice] = useState((item.priceCents / 100).toString());
  const [stock, setStock] = useState(item.stock === null ? "" : String(item.stock));

  return (
    <div className="card item-row">
      <div className="thumb" style={{ background: item.tint ?? "#E1EBFF", width: 56, height: 56 }}>
        <ItemArt item={item} />
      </div>
      <div className="stack gap-10">
        <div className="item-fields">
          <label className="field" style={{ fontSize: 12 }}>Name
            <input className="input sm" value={name} onChange={(e) => setName(e.target.value)} onBlur={() => name !== item.name && onSave(item.id, { name })} />
          </label>
          <label className="field" style={{ fontSize: 12 }}>Price ($)
            <input className="input sm" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)}
              onBlur={() => {
                const cents = Math.round(Number(price) * 100);
                if (Number.isFinite(cents) && cents >= 0 && cents !== item.priceCents) onSave(item.id, { priceCents: cents });
              }} />
          </label>
          <label className="field" style={{ fontSize: 12 }}>Stock
            <input className="input sm" inputMode="numeric" placeholder="unlimited" value={stock} onChange={(e) => setStock(e.target.value)}
              onBlur={() => {
                const v = stock.trim() === "" ? null : Number.parseInt(stock, 10);
                if (v !== item.stock && (v === null || v >= 0)) onSave(item.id, { stock: v });
              }} />
          </label>
          <label className="field" style={{ fontSize: 12 }}>Section
            <select className="input sm" value={item.category} onChange={(e) => onSave(item.id, { category: e.target.value as Item["category"] })}>
              <option value="menu">Menu</option>
              <option value="limited">Limited edition</option>
            </select>
          </label>
          <label className="field" style={{ fontSize: 12 }}>Drawing
            <select className="input sm" value={item.glyph ?? ""} onChange={(e) => onSave(item.id, { glyph: e.target.value })}>
              <option value="">Plain balloon</option>
              {GLYPH_KEYS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </label>
          <label className="field" style={{ fontSize: 12 }}>Tile color
            <input className="input sm" type="color" value={item.tint ?? "#E1EBFF"} onChange={(e) => onSave(item.id, { tint: e.target.value })} style={{ padding: 4 }} />
          </label>
        </div>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
          <label style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 700, minHeight: 44 }}>
            <input type="checkbox" checked={item.active} onChange={(e) => onSave(item.id, { active: e.target.checked })} style={{ width: 20, height: 20 }} />
            Show on site
          </label>
          <label className="link-btn" style={{ position: "relative" }}>
            {item.photoUrl ? "Replace photo" : "Upload photo"}
            <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) api.admin.uploadPhoto(item.id, f).then((r) => onItems(r.items), alertError);
              }} />
          </label>
        </div>
      </div>
    </div>
  );
}

// ---------- event settings ----------

const SETTING_FIELDS: { key: keyof Settings; label: string }[] = [
  { key: "school_name", label: "School name" },
  { key: "event_date", label: "Event date" },
  { key: "event_time", label: "Event time" },
  { key: "event_place", label: "Where" },
  { key: "cutoff", label: "Pre-order cutoff" },
  { key: "purpose", label: "What the money is for" },
  { key: "donation_url", label: "School donation page URL" },
  { key: "contact_email", label: "Contact email" },
];

function EventSettings() {
  const [s, setS] = useState<Settings | null>(null);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    api.admin.settings().then((r) => setS(r.settings), alertError);
  }, []);
  if (!s) return <p className="small">Loading…</p>;

  return (
    <form
      className="card stack gap-14"
      onSubmit={(e) => {
        e.preventDefault();
        api.admin.saveSettings(s).then((r) => {
          setS(r.settings);
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        }, alertError);
      }}
    >
      <label style={{ display: "flex", gap: 10, alignItems: "center", fontWeight: 800, minHeight: 44 }}>
        <input type="checkbox" checked={s.orders_open === "1"} onChange={(e) => setS({ ...s, orders_open: e.target.checked ? "1" : "0" })} style={{ width: 22, height: 22 }} />
        Pre-orders are open
      </label>
      {SETTING_FIELDS.map((f) => (
        <label key={f.key} className="field">
          {f.label}
          <input className="input" value={s[f.key]} onChange={(e) => setS({ ...s, [f.key]: e.target.value })} />
        </label>
      ))}
      <button className="btn btn-ink">{saved ? "Saved" : "Save event details"}</button>
    </form>
  );
}

function alertError(e: unknown) {
  window.alert(e instanceof Error ? e.message : "Something went wrong.");
}
