import { useState, type DragEvent, type FormEvent } from "react";
import { formatCents, MAX_RECEIPT_BYTES, RECEIPT_TYPES } from "../../shared/types";
import { ApiError, api } from "../api";
import { ItemArt } from "../components/Glyph";
import { ArrowRight, BackHeader, LoadError, Loading, UploadIcon } from "../components/ui";
import { Link, navigate } from "../router";
import { useStore } from "../store";

export const LAST_ORDER_KEY = "bxb-last-order";

function CartRow({ itemId }: { itemId: string }) {
  const { lines, setQty, setNote } = useStore();
  const line = lines.find((l) => l.item.id === itemId);
  const [noteOpen, setNoteOpen] = useState(() => Boolean(line?.note));
  if (!line) return null;
  const { item, qty, note } = line;
  const atMax = item.stock !== null && qty >= item.stock;

  return (
    <li className="card stack gap-10" style={{ padding: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div className="thumb" style={{ background: item.tint ?? "#E1EBFF" }}>
          <ItemArt item={item} />
        </div>
        <div className="stack" style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <span style={{ fontWeight: 800 }}>{item.name}</span>
          <span className="small" style={{ fontWeight: 700 }}>
            {formatCents(item.priceCents)} each{item.stock !== null ? ` · ${item.stock} left` : ""}
          </span>
        </div>
        <div className="stepper">
          <button type="button" onClick={() => setQty(item.id, qty - 1)} aria-label={`One less ${item.name}`}>−</button>
          <span aria-live="polite">{qty}</span>
          <button type="button" onClick={() => setQty(item.id, qty + 1)} disabled={atMax} aria-label={`One more ${item.name}`}>+</button>
        </div>
      </div>
      {noteOpen ? (
        <label className="field" style={{ fontSize: 13, color: "var(--ink-2)" }}>
          Note for this balloon
          <input
            className="input sm"
            value={note}
            maxLength={200}
            placeholder="e.g. blue ears, please"
            onChange={(e) => setNote(item.id, e.target.value)}
          />
        </label>
      ) : (
        <button type="button" className="link-btn" style={{ alignSelf: "flex-start" }} onClick={() => setNoteOpen(true)}>
          + Add note (color, name…)
        </button>
      )}
    </li>
  );
}

export function Order() {
  const store = useStore();
  const { settings, items, loadError, reload, lines, count, totalCents, clearCart } = store;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const header = <BackHeader href="/" label="Back to the balloon menu">Your pre-order</BackHeader>;
  if (loadError) return <>{header}<LoadError message={loadError} retry={reload} /></>;
  if (!settings || !items) return <>{header}<Loading /></>;

  const pickFile = (f: File | undefined | null) => {
    if (!f) return;
    if (!RECEIPT_TYPES.includes(f.type)) {
      setError("The receipt must be an image (PNG, JPG, HEIC) or a PDF.");
      return;
    }
    if (f.size > MAX_RECEIPT_BYTES) {
      setError("That file is over 10 MB. Try a screenshot instead.");
      return;
    }
    setError(null);
    setReceipt(f);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDrag(false);
    pickFile(e.dataTransfer.files[0]);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (count === 0) return setError("Your order is empty. Add some balloons first.");
    if (!receipt) return setError("Please attach your donation receipt.");
    setError(null);
    setSubmitting(true);
    try {
      const res = await api.submitOrder(
        {
          name,
          email,
          phone,
          lines: lines.map((l) => ({ itemId: l.item.id, qty: l.qty, note: l.note || undefined })),
        },
        receipt,
      );
      sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify(res));
      clearCart();
      reload();
      navigate(`/order/${res.order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      if (err instanceof ApiError && err.status === 409) reload(); // stock changed
    } finally {
      setSubmitting(false);
    }
  };

  if (settings.orders_open !== "1") {
    return (
      <>
        {header}
        <main className="page section stack gap-14">
          <h1 className="h1 sm">Pre-orders are closed</h1>
          <p className="lede">Come see us at {settings.event_place} on {settings.event_date} — we'll twist balloons on the spot.</p>
          <Link href="/" className="btn btn-ink">Back to home</Link>
        </main>
      </>
    );
  }

  return (
    <>
      {header}
      <main className="page">
        <section className="section stack gap-10" style={{ paddingTop: 20 }}>
          {count === 0 ? (
            <div className="card stack gap-10" style={{ textAlign: "center", padding: 24 }}>
              <span style={{ fontWeight: 800 }}>Your order is empty</span>
              <Link href="/" className="btn btn-ink">Pick some balloons</Link>
            </div>
          ) : (
            <ul className="stack gap-10" style={{ margin: 0, padding: 0, listStyle: "none" }}>
              {lines.map((l) => <CartRow key={l.item.id} itemId={l.item.id} />)}
            </ul>
          )}
          {count > 0 && (
            <Link href="/" className="link-btn">+ Add more balloons</Link>
          )}
        </section>

        <section className="section" style={{ paddingTop: 6 }}>
          <div className="card-navy stack gap-14" style={{ borderRadius: 20, padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontWeight: 700, color: "#C9D1EA" }}>{count} balloon{count === 1 ? "" : "s"}</span>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 26 }}>{formatCents(totalCents)}</span>
            </div>
            <p style={{ fontSize: 15 }}>
              Please follow the steps to donate <strong>{formatCents(totalCents)}</strong> to the school, then drop your
              receipt below.
            </p>
            <Link href="/donate" className="link-btn" style={{ color: "var(--yellow-on-navy)", fontSize: 15 }}>
              Show me the donation steps <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        <form className="section stack gap-14" style={{ paddingBottom: 40 }} onSubmit={submit} noValidate={false}>
          <h2 className="h2">Your details</h2>
          <label className="field">
            Name
            <input className="input" required maxLength={80} autoComplete="name" placeholder="Who's picking up?" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <div className="grid-2">
            <label className="field">
              Email
              <input className="input" required type="email" maxLength={254} autoComplete="email" inputMode="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label className="field">
              Phone
              <input className="input" required type="tel" maxLength={30} autoComplete="tel" placeholder="(555) 555-0100" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </label>
          </div>

          <div className="stack gap-6">
            <span style={{ fontSize: 14, fontWeight: 800 }} id="receipt-label">Donation receipt</span>
            <label
              className={`dropzone${drag ? " drag" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDrag(true);
              }}
              onDragLeave={() => setDrag(false)}
              onDrop={onDrop}
            >
              <UploadIcon />
              {receipt ? (
                <>
                  <span style={{ fontWeight: 800, color: "var(--green-text)", wordBreak: "break-all" }}>{receipt.name}</span>
                  <span className="small" style={{ fontWeight: 700, color: "var(--link)" }}>Tap to choose a different file</span>
                </>
              ) : (
                <>
                  <span style={{ fontWeight: 800 }}>Drop your receipt here</span>
                  <span className="small">or tap to choose: screenshot, photo or PDF</span>
                </>
              )}
              <input
                type="file"
                accept="image/*,.pdf,application/pdf"
                aria-labelledby="receipt-label"
                onChange={(e) => pickFile(e.target.files?.[0])}
              />
            </label>
          </div>

          <div className="card-yellow">
            <strong>Before you submit:</strong> check that your receipt shows <strong>{settings.school_name}</strong> and
            the amount <strong>{formatCents(totalCents)}</strong>. We check every receipt by hand — if something doesn't
            match, we'll contact you by email or phone.
          </div>

          <p className="small">
            Pick up your balloons at the Balloon x Bros table on {settings.event_date}. Give your name and we'll have
            them ready.
          </p>

          {error && <div className="error" role="alert">{error}</div>}

          <button type="submit" className="btn btn-red btn-block" disabled={submitting || count === 0}>
            {submitting ? "Sending…" : "Submit pre-order"}
          </button>
        </form>
      </main>
    </>
  );
}
