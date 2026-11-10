import { cn } from "cn";
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
import { ErrorBox, Logo } from "../components/ui";
import { Button, buttonVariants } from "../components/ui/button";
import { Checkbox } from "../components/ui/checkbox";
import { Input, inputVariants } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";

type Tab = "orders" | "menu" | "event";

const STATUS_LABEL: Record<OrderStatus, string> = {
  submitted: "New",
  issue: "Receipt issue",
  verified: "Verified",
  picked_up: "Picked up",
  cancelled: "Cancelled",
};

const STATUS_CLASS: Record<OrderStatus, string> = {
  submitted: "bg-yellow-100 text-yellow-900",
  issue: "bg-red-100 text-red-900",
  verified: "bg-blue-100 text-blue-800",
  picked_up: "bg-accent-100 text-accent-700",
  cancelled: "bg-line text-muted",
};

const cardClass = "rounded-2xl border border-line bg-surface p-4";
const fieldClass = "flex min-w-0 flex-col gap-1.5 text-sm font-extrabold";
const itemFieldClass = "flex min-w-0 flex-col gap-1.5 text-xs font-extrabold";
const smallClass = "text-[13px] text-muted";
const selectSmClass = inputVariants({ size: "sm" });
// Site checkbox: 22px (20px in the item editor), ink when checked.
const checkboxClass =
  "size-[22px] rounded-md border-2 border-line-strong bg-white data-checked:border-ink data-checked:bg-ink data-checked:text-white";

export function Admin() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>("orders");

  useEffect(() => {
    api.admin.me().then(
      () => setAuthed(true),
      () => setAuthed(false),
    );
  }, []);

  if (authed === null) return null;
  if (!authed) return <Login onDone={() => setAuthed(true)} />;

  return (
    <div>
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-[980px] items-center justify-between gap-2 px-5 py-3.5">
          <span className="flex items-center gap-2.5 text-ink">
            <Logo size={28} />
            <span className="font-heading text-[19px] font-bold tracking-[-0.2px]">Admin</span>
          </span>
          <Button
            type="button"
            variant="pill"
            className="bg-white hover:bg-white"
            onClick={() => api.admin.logout().finally(() => setAuthed(false))}
          >
            Log out
          </Button>
        </div>
      </header>
      <main className="mx-auto flex min-h-screen w-full max-w-[980px] flex-col gap-3.5 px-5 py-4">
        <div className="flex flex-wrap gap-1.5" role="toolbar" aria-label="Sections">
          {(["orders", "menu", "event"] as Tab[]).map((t) => (
            <Button
              key={t}
              type="button"
              variant="tab"
              aria-pressed={tab === t}
              onClick={() => setTab(t)}
            >
              {t === "orders" ? "Orders" : t === "menu" ? "Balloons" : "Event"}
            </Button>
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
    <main className="mx-auto flex min-h-screen w-full max-w-[420px] flex-col gap-3.5 px-5 pt-20 pb-4">
      <Logo size={40} />
      <h1 className="text-[34px] leading-[1.05] font-bold tracking-[-0.5px]">
        Balloon x Bros admin
      </h1>
      <form className="flex flex-col gap-3.5" onSubmit={submit}>
        <label className={fieldClass}>
          Password
          <Input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error && (
          <div role="alert">
            <ErrorBox>{error}</ErrorBox>
          </div>
        )}
        <Button type="submit" variant="ink" size="lg" disabled={busy}>
          {busy ? "Checking…" : "Log in"}
        </Button>
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

  if (error) return <ErrorBox>{error}</ErrorBox>;
  if (!orders) return <p className={smallClass}>Loading orders…</p>;

  return (
    <div className="flex flex-col gap-3.5">
      <div className="mt-1.5 grid grid-cols-3 gap-2">
        <InfoTile label="Orders" value={totals.count} />
        <InfoTile label="Balloons" value={totals.balloons} />
        <InfoTile label="Raised" value={formatCents(totals.cents)} />
      </div>

      {toMake.length > 0 && (
        <details className={cardClass}>
          <summary className="min-h-7 cursor-pointer font-extrabold">Still to make</summary>
          <ul className="mt-2 list-disc pl-[18px]">
            {toMake.map(([name, n]) => (
              <li key={name}>
                {n} × {name}
              </li>
            ))}
          </ul>
        </details>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Input
          size="sm"
          className="flex-[1_1_200px]"
          placeholder="Search name, email, phone, code"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search orders"
        />
        <select
          className={cn(selectSmClass, "w-auto")}
          value={filter}
          onChange={(e) => setFilter(e.target.value as OrderStatus | "all")}
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          {(Object.keys(STATUS_LABEL) as OrderStatus[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <Button type="button" variant="tab" onClick={load}>
          Refresh
        </Button>
      </div>

      {shown.length === 0 && <p className={smallClass}>No orders yet.</p>}
      {shown.map((o) => (
        <OrderCard key={o.id} order={o} onUpdate={update} />
      ))}
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-xl border border-line bg-surface p-3">
      <span className="text-[11px] font-extrabold tracking-[0.8px] text-muted uppercase">
        {label}
      </span>
      <strong className="text-sm [overflow-wrap:anywhere]">{value}</strong>
    </div>
  );
}

function OrderCard({
  order: o,
  onUpdate,
}: {
  order: AdminOrder;
  onUpdate: (id: string, p: { status?: OrderStatus; adminNote?: string }) => void;
}) {
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
          ? [
              { label: "Picked up", status: "picked_up" },
              { label: "Back to new", status: "submitted" },
            ]
          : o.status === "picked_up"
            ? [{ label: "Undo pickup", status: "verified" }]
            : [{ label: "Restore", status: "submitted" }];

  return (
    <article className={cn(cardClass, "flex flex-col gap-2.5")}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <strong className="text-[17px]">{o.name}</strong>
        <span
          className={cn(
            "rounded-full px-2.5 py-[3px] text-xs font-extrabold tracking-[0.6px] uppercase",
            STATUS_CLASS[o.status],
          )}
        >
          {STATUS_LABEL[o.status]}
        </span>
      </div>
      <div className={smallClass}>
        {o.id} · {new Date(o.createdAt).toLocaleString()} ·{" "}
        <a href={`mailto:${o.email}`}>{o.email}</a> · <a href={`tel:${o.phone}`}>{o.phone}</a>
        {!o.emailSent && " · email not sent"}
      </div>
      <ul className="m-0 list-disc pl-[18px]">
        {o.lines.map((l) => (
          <li key={l.itemId}>
            {l.qty} × {l.name}
            {l.note && <span className={smallClass}> — {l.note}</span>}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-auto">
          <span className={smallClass}>Receipt should show </span>
          <strong>{formatCents(o.totalCents)}</strong>
        </span>
        <a
          className={cn(buttonVariants({ variant: "tab" }), "text-ink hover:text-ink")}
          href={o.receiptUrl}
          target="_blank"
          rel="noreferrer"
        >
          View receipt
        </a>
        {next.map((n) => (
          <Button
            key={n.status}
            type="button"
            variant="tab"
            onClick={() => onUpdate(o.id, { status: n.status })}
          >
            {n.label}
          </Button>
        ))}
      </div>
      {o.status === "issue" && (
        <div className="rounded-[16px] bg-yellow-100 px-4 py-3.5 text-sm text-yellow-900">
          Contact {o.name.split(" ")[0]} about the receipt:{" "}
          <a
            href={`mailto:${o.email}?subject=${encodeURIComponent(`Your Balloon x Bros pre-order ${o.id}`)}`}
          >
            email
          </a>{" "}
          or <a href={`tel:${o.phone}`}>call {o.phone}</a>. Note what you found below.
        </div>
      )}
      <Input
        size="sm"
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
  if (!items) return <p className={smallClass}>Loading balloons…</p>;

  const save = (id: string, patch: Partial<Item>) =>
    api.admin.updateItem(id, patch).then((r) => setItems(r.items), alertError);

  return (
    <div className="flex flex-col gap-3.5">
      <p className={smallClass}>
        Changes save when you leave a field. Leave stock empty for unlimited (regular menu).
      </p>
      {items.map((i) => (
        <ItemEditor key={i.id} item={i} onSave={save} onItems={setItems} />
      ))}
      <form
        className={cn(cardClass, "flex flex-wrap gap-2")}
        onSubmit={(e) => {
          e.preventDefault();
          if (!newId.trim()) return;
          api.admin.createItem({ id: newId, name: newId }).then((r) => {
            setItems(r.items);
            setNewId("");
          }, alertError);
        }}
      >
        <Input
          size="sm"
          className="flex-[1_1_200px]"
          placeholder="New balloon name"
          value={newId}
          onChange={(e) => setNewId(e.target.value)}
          aria-label="New balloon name"
        />
        <Button type="submit" variant="tab">
          Add balloon
        </Button>
      </form>
    </div>
  );
}

function ItemEditor({
  item,
  onSave,
  onItems,
}: {
  item: Item;
  onSave: (id: string, p: Partial<Item>) => void;
  onItems: (i: Item[]) => void;
}) {
  const [name, setName] = useState(item.name);
  const [price, setPrice] = useState((item.priceCents / 100).toString());
  const [stock, setStock] = useState(item.stock === null ? "" : String(item.stock));

  return (
    <div className={cn(cardClass, "grid grid-cols-[56px_minmax(0,1fr)] items-start gap-3")}>
      <div
        className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl [&_img]:size-full [&_img]:object-cover [&>svg]:h-auto [&>svg]:w-3/4"
        style={{ background: item.tint ?? "#E1EBFF" }}
      >
        <ItemArt item={item} />
      </div>
      <div className="flex flex-col gap-2.5">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-2">
          <label className={itemFieldClass}>
            Name
            <Input
              size="sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => name !== item.name && onSave(item.id, { name })}
            />
          </label>
          <label className={itemFieldClass}>
            Price ($)
            <Input
              size="sm"
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              onBlur={() => {
                const cents = Math.round(Number(price) * 100);
                if (Number.isFinite(cents) && cents >= 0 && cents !== item.priceCents)
                  onSave(item.id, { priceCents: cents });
              }}
            />
          </label>
          <label className={itemFieldClass}>
            Stock
            <Input
              size="sm"
              inputMode="numeric"
              placeholder="unlimited"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              onBlur={() => {
                const v = stock.trim() === "" ? null : Number.parseInt(stock, 10);
                if (v !== item.stock && (v === null || v >= 0)) onSave(item.id, { stock: v });
              }}
            />
          </label>
          <label className={itemFieldClass}>
            Section
            <select
              className={selectSmClass}
              value={item.category}
              onChange={(e) => onSave(item.id, { category: e.target.value as Item["category"] })}
            >
              <option value="menu">Menu</option>
              <option value="limited">Limited edition</option>
            </select>
          </label>
          <label className={itemFieldClass}>
            Drawing
            <select
              className={selectSmClass}
              value={item.glyph ?? ""}
              onChange={(e) => onSave(item.id, { glyph: e.target.value })}
            >
              <option value="">Plain balloon</option>
              {GLYPH_KEYS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </label>
          <label className={itemFieldClass}>
            Tile color
            <Input
              size="sm"
              type="color"
              className="p-1"
              value={item.tint ?? "#E1EBFF"}
              onChange={(e) => onSave(item.id, { tint: e.target.value })}
            />
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-3.5">
          <label className="flex min-h-11 items-center gap-2 font-bold">
            <Checkbox
              className={cn(checkboxClass, "size-5")}
              checked={item.active}
              onCheckedChange={(checked) => onSave(item.id, { active: checked })}
            />
            Show on site
          </label>
          <label className={cn(buttonVariants({ variant: "link" }), "relative")}>
            {item.photoUrl ? "Replace photo" : "Upload photo"}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) api.admin.uploadPhoto(item.id, f).then((r) => onItems(r.items), alertError);
              }}
            />
          </label>
        </div>
      </div>
    </div>
  );
}

// ---------- event settings ----------

const SETTING_FIELDS: { key: keyof Settings; label: string; multiline?: boolean }[] = [
  { key: "school_name", label: "School name" },
  { key: "event_date", label: "Event date" },
  { key: "event_time", label: "Event time" },
  { key: "event_place", label: "Where" },
  { key: "event_address", label: "Street address (map links)" },
  { key: "announcement", label: "Home announcement", multiline: true },
  { key: "donation_url", label: "School donation page URL" },
  { key: "contact_email", label: "Contact email" },
];

function EventSettings() {
  const [s, setS] = useState<Settings | null>(null);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    api.admin.settings().then((r) => setS(r.settings), alertError);
  }, []);
  if (!s) return <p className={smallClass}>Loading…</p>;

  return (
    <form
      className={cn(cardClass, "flex flex-col gap-3.5")}
      onSubmit={(e) => {
        e.preventDefault();
        api.admin.saveSettings(s).then((r) => {
          setS(r.settings);
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        }, alertError);
      }}
    >
      <label className="flex min-h-11 items-center gap-2.5 font-extrabold">
        <Checkbox
          className={checkboxClass}
          checked={s.orders_open === "1"}
          onCheckedChange={(checked) => setS({ ...s, orders_open: checked ? "1" : "0" })}
        />
        Pre-orders are open
      </label>
      {SETTING_FIELDS.map((f) => (
        <label key={f.key} className={fieldClass}>
          {f.label}
          {f.multiline ? (
            <Textarea
              value={s[f.key]}
              maxLength={500}
              onChange={(e) => setS({ ...s, [f.key]: e.target.value })}
            />
          ) : (
            <Input value={s[f.key]} onChange={(e) => setS({ ...s, [f.key]: e.target.value })} />
          )}
        </label>
      ))}
      <Button type="submit" variant="ink" size="lg">
        {saved ? "Saved" : "Save event details"}
      </Button>
    </form>
  );
}

function alertError(e: unknown) {
  window.alert(e instanceof Error ? e.message : "Something went wrong.");
}
