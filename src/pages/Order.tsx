import { useState, type DragEvent, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { cn } from "cn";
import { formatCents, MAX_RECEIPT_BYTES, RECEIPT_TYPES } from "../../shared/types";
import { ApiError, api } from "../api";
import { ItemArt } from "../components/Glyph";
import { ArrowRight, BackHeader, ErrorBox, LoadError, Loading, UploadIcon } from "../components/ui";
import { buttonVariants } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { SCHOOL_SITE } from "../lib/school-site";
import { useStore } from "../store";

export const LAST_ORDER_KEY = "bxb-last-order";

const stepperButton =
  "size-11 cursor-pointer rounded-full border-none bg-transparent text-[22px] font-bold hover:bg-[#e6ebfa]";

function CartRow({ itemId }: { itemId: string }) {
  const { lines, setQty, setNote } = useStore();
  const line = lines.find((l) => l.item.id === itemId);
  const [noteOpen, setNoteOpen] = useState(() => Boolean(line?.note));
  if (!line) return null;
  const { item, qty, note } = line;
  const atMax = item.stock !== null && qty >= item.stock;

  return (
    <li className="flex flex-col gap-2.5 rounded-2xl border border-line bg-surface p-3.5">
      <div className="flex items-center gap-3">
        <div
          className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl [&_img]:size-full [&_img]:object-cover [&>svg]:h-auto [&>svg]:w-3/4"
          style={{ background: item.tint ?? "#E1EBFF" }}
        >
          <ItemArt item={item} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="font-extrabold">{item.name}</span>
          <span className="text-[13px] font-bold text-muted">
            {formatCents(item.priceCents)} each{item.stock !== null ? ` · ${item.stock} left` : ""}
          </span>
        </div>
        <div className="flex items-center gap-0.5 rounded-full bg-ground p-0.5">
          <button
            type="button"
            className={stepperButton}
            onClick={() => setQty(item.id, qty - 1)}
            aria-label={`One less ${item.name}`}
          >
            −
          </button>
          <span className="min-w-5 text-center font-extrabold" aria-live="polite">
            {qty}
          </span>
          <button
            type="button"
            className={stepperButton}
            onClick={() => setQty(item.id, qty + 1)}
            disabled={atMax}
            aria-label={`One more ${item.name}`}
          >
            +
          </button>
        </div>
      </div>
      {noteOpen ? (
        <label className="flex min-w-0 flex-col gap-1.5 text-[13px] font-extrabold text-ink-2">
          Note for this balloon
          <Input
            size="sm"
            className="text-ink-2"
            value={note}
            maxLength={200}
            placeholder="e.g. blue ears, please"
            onChange={(e) => setNote(item.id, e.target.value)}
          />
        </label>
      ) : (
        <button
          type="button"
          className={cn(buttonVariants({ variant: "link" }), "self-start")}
          onClick={() => setNoteOpen(true)}
        >
          + Add note (color, name…)
        </button>
      )}
    </li>
  );
}

export function Order() {
  const store = useStore();
  const { settings, loadError, reload, lines, count, totalCents, clearCart, cartReady } = store;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const header = (
    <BackHeader to="/" label="Back to the balloon menu">
      Your pre-order
    </BackHeader>
  );
  if (loadError)
    return (
      <>
        {header}
        <LoadError message={loadError} retry={reload} />
      </>
    );
  // Wait for the saved cart so the page doesn't flash "your order is empty".
  if (!cartReady)
    return (
      <>
        {header}
        <Loading />
      </>
    );

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
    let res: Awaited<ReturnType<typeof api.submitOrder>>;
    try {
      res = await api.submitOrder(
        {
          name,
          email,
          phone,
          lines: lines.map((l) => ({ itemId: l.item.id, qty: l.qty, note: l.note || undefined })),
        },
        receipt,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      if (err instanceof ApiError && err.status === 409) reload(); // stock changed
      setSubmitting(false);
      return;
    }
    // The order went through: nothing below may report it as a failure.
    try {
      sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify(res));
    } catch {
      /* private mode: the confirmation page falls back to the generic text */
    }
    // Clear the cart once we've left this page, so it never flashes "empty".
    navigate({ to: "/order/$code", params: { code: res.order.id } })
      .catch((err: unknown) => console.error("navigate", err))
      .finally(() => {
        clearCart();
        reload();
        setSubmitting(false);
      });
  };

  if (settings.orders_open !== "1") {
    return (
      <>
        {header}
        <main className="mx-auto flex min-h-screen w-full max-w-[640px] flex-col gap-3.5 px-5 py-4">
          <h1 className="text-[34px] leading-[1.05] font-bold tracking-[-0.5px]">
            Pre-orders are closed
          </h1>
          <p className="text-base text-ink-2">
            Come see us at {settings.event_place} on {settings.event_date} — we'll twist balloons on
            the spot.
          </p>
          <Link to="/" className={buttonVariants({ variant: "ink", size: "lg" })}>
            Back to home
          </Link>
        </main>
      </>
    );
  }

  return (
    <>
      {header}
      <main className="mx-auto flex min-h-screen w-full max-w-[640px] flex-col">
        <section className="flex flex-col gap-2.5 px-5 pt-5 pb-4">
          {count === 0 ? (
            <div className="flex flex-col gap-2.5 rounded-2xl border border-line bg-surface p-6 text-center">
              <span className="font-extrabold">Your order is empty</span>
              <Link to="/" className={buttonVariants({ variant: "ink", size: "lg" })}>
                Pick some balloons
              </Link>
            </div>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
              {lines.map((l) => (
                <CartRow key={l.item.id} itemId={l.item.id} />
              ))}
            </ul>
          )}
          {count > 0 && (
            <Link to="/" className={cn(buttonVariants({ variant: "link" }), "justify-start")}>
              + Add more balloons
            </Link>
          )}
        </section>

        <section className="px-5 pt-1.5 pb-4">
          <div className="flex flex-col gap-3.5 rounded-[20px] bg-ink p-[18px] text-white [&_a]:text-white">
            <div className="flex items-baseline justify-between">
              <span className="font-bold text-[#c9d1ea]">
                {count} balloon{count === 1 ? "" : "s"}
              </span>
              <span className="font-heading text-[26px] font-semibold">
                {formatCents(totalCents)}
              </span>
            </div>
            <p className="text-[15px]">
              Please follow the steps to donate <strong>{formatCents(totalCents)}</strong> to the
              school, then drop your receipt below.
            </p>
            <Link
              to="/donate"
              className={cn(
                buttonVariants({ variant: "link" }),
                // ! beats the card's [&_a]:text-white and the hover colour, as the old inline style did
                "justify-start text-[15px] text-yellow-on-navy!",
              )}
            >
              Show me the donation steps <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        <form
          className="flex flex-col gap-3.5 px-5 pt-4 pb-10"
          onSubmit={submit}
          noValidate={false}
        >
          <h2 className="text-[22px] font-semibold">Your details</h2>
          <label className="flex min-w-0 flex-col gap-1.5 text-sm font-extrabold">
            Name
            <Input
              required
              maxLength={80}
              autoComplete="name"
              placeholder="Who's picking up?"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <label className="flex min-w-0 flex-col gap-1.5 text-sm font-extrabold">
              Email
              <Input
                required
                type="email"
                maxLength={254}
                autoComplete="email"
                inputMode="email"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="flex min-w-0 flex-col gap-1.5 text-sm font-extrabold">
              Phone
              <Input
                required
                type="tel"
                maxLength={30}
                autoComplete="tel"
                placeholder="(555) 555-0100"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </label>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-extrabold" id="receipt-label">
              Donation receipt
            </span>
            <label
              className={cn(
                "relative flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-[#7f8bb3] bg-white px-[18px] py-[26px] text-center focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-blue",
                drag && "border-blue bg-[#eef3ff]",
              )}
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
                  <span className="font-extrabold break-all text-green-text">{receipt.name}</span>
                  <span className="text-[13px] font-bold text-link">
                    Tap to choose a different file
                  </span>
                </>
              ) : (
                <>
                  <span className="font-extrabold">Drop your receipt here</span>
                  <span className="text-[13px] text-muted">
                    or tap to choose: a screenshot or PDF of the receipt page or email
                  </span>
                </>
              )}
              <input
                type="file"
                className="absolute inset-0 cursor-pointer opacity-0"
                accept="image/*,.pdf,application/pdf"
                aria-labelledby="receipt-label"
                onChange={(e) => pickFile(e.target.files?.[0])}
              />
            </label>
          </div>

          <div className="rounded-[16px] bg-yellow-tint px-4 py-3.5 text-sm text-[#3d3420]">
            <strong>Before you submit:</strong> check that your receipt shows{" "}
            <strong>{SCHOOL_SITE.fund}</strong>, <strong>{SCHOOL_SITE.student}</strong> and the
            amount <strong>{formatCents(totalCents)}</strong>. We check every receipt by hand — if
            something doesn't match, we'll contact you by email or phone.
          </div>

          <p className="text-[13px] text-muted">
            Pick up your balloons at the Balloon x Bros table on {settings.event_date}. Give your
            name and we'll have them ready.
          </p>

          {error && (
            <div role="alert">
              <ErrorBox>{error}</ErrorBox>
            </div>
          )}

          <button
            type="submit"
            className={buttonVariants({ variant: "red", size: "lg", block: true })}
            disabled={submitting || count === 0}
          >
            {submitting ? "Sending…" : "Submit pre-order"}
          </button>
        </form>
      </main>
    </>
  );
}
