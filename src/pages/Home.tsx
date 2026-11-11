import { Link } from "@tanstack/react-router";
import { cn } from "cn";
import { formatCents, type Item } from "../../shared/types";
import { ItemArt } from "../components/Glyph";
import { ArrowRight, LoadError, MegaphoneIcon, SiteHeader, WrenchIcon } from "../components/ui";
import { Button, buttonVariants } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { eventMapUrl } from "../../shared/place";
import { splitOnPhrase } from "../lib/place-link";
import { useStore } from "../store";

const badge =
  "pointer-events-none absolute top-2 inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full px-[7px] text-[12px] font-extrabold";
const label = "font-extrabold tracking-[0.8px] uppercase";
const stepItem = "flex flex-col gap-1.5 text-[13px] leading-[1.35] font-bold";
const stepNum =
  "inline-flex size-7 shrink-0 items-center justify-center rounded-full text-[14px] font-extrabold text-white";
const infoTile = "flex flex-col gap-0.5 rounded-xl border border-line bg-yellow-200 p-3";
const infoValue = "text-[14px] [overflow-wrap:anywhere]";
const menuGrid = "grid grid-cols-3 gap-2.5 min-[560px]:grid-cols-4 min-[560px]:gap-3.5";

function Tile({ item }: { item: Item }) {
  const { cart, add } = useStore();
  const inCart = cart[item.id]?.qty ?? 0;
  const limited = item.stock !== null;
  const soldOut = item.stock === 0;
  const atMax = limited && inCart >= (item.stock ?? 0);
  const tint = item.tint ?? "#E1EBFF";

  return (
    <Dialog>
      <div className="flex flex-col gap-1.5">
        <div
          className={cn(
            "relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl [&_img]:size-full [&_img]:object-cover [&_svg]:h-auto [&_svg]:w-[64%]",
            soldOut && "bg-line-strong [&_img]:opacity-35 [&_svg]:opacity-35",
          )}
          style={soldOut ? undefined : { background: tint }}
        >
          {item.photoUrl ? (
            // The photo opens a bigger view; the badges sit on top of it but
            // let taps through, and the + button stays its own target.
            <DialogTrigger
              className="absolute inset-0 flex cursor-zoom-in items-center justify-center border-none bg-transparent p-0"
              aria-label={`See a bigger photo of ${item.name}`}
            >
              <ItemArt item={item} />
            </DialogTrigger>
          ) : (
            <ItemArt item={item} />
          )}
          {limited && (
            <span
              className={cn(
                badge,
                "right-2",
                soldOut ? "bg-ink text-white" : "bg-yellow-300 text-ink",
              )}
            >
              {soldOut ? "Sold out" : `${item.stock} left`}
            </span>
          )}
          {inCart > 0 && (
            <span
              className={cn(badge, "bg-ink text-white", limited ? "left-2" : "right-2")}
              aria-label={`${inCart} in your order`}
            >
              {inCart}
            </span>
          )}
          <button
            type="button"
            className="absolute bottom-1.5 left-1.5 size-11 cursor-pointer rounded-lg border-none bg-white text-2xl leading-none font-bold text-ink shadow-xs shadow-ink/18 active:scale-[0.94] disabled:cursor-not-allowed disabled:opacity-45"
            onClick={() => add(item.id)}
            disabled={soldOut || atMax}
            aria-label={soldOut ? `${item.name} is sold out` : `Add ${item.name}`}
          >
            +
          </button>
        </div>
        <span className="text-[14px] leading-[1.2] font-extrabold">{item.name}</span>
        <span className={cn("text-[13px] font-bold", soldOut && "line-through")}>
          {formatCents(item.priceCents)}
        </span>
      </div>
      {item.photoUrl && (
        <DialogContent>
          <img
            src={item.photoUrl}
            alt={item.name}
            className={cn("aspect-square w-full rounded-2xl object-cover", soldOut && "opacity-50")}
            style={{ background: tint }}
          />
          <div className="flex items-baseline justify-between gap-3">
            <DialogTitle>{item.name}</DialogTitle>
            <span
              className={cn("text-[18px] font-extrabold", soldOut && "text-muted line-through")}
            >
              {formatCents(item.priceCents)}
            </span>
          </div>
          <DialogDescription>
            {soldOut ? "Sold out" : limited ? `${item.stock} left` : "Made to order"}
            {inCart > 0 && ` · ${inCart} in your order`}
          </DialogDescription>
          <Button
            variant="red"
            size="md"
            block
            onClick={() => add(item.id)}
            disabled={soldOut || atMax}
          >
            {soldOut ? "Sold out" : atMax ? "All of them are in your order" : "+ Add to order"}
          </Button>
        </DialogContent>
      )}
    </Dialog>
  );
}

export function Home() {
  const { items, settings, loadError, reload, count } = useStore();
  if (loadError)
    return (
      <>
        <SiteHeader />
        <LoadError message={loadError} retry={reload} />
      </>
    );

  const open = settings.orders_open === "1";

  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex min-h-screen w-full max-w-[640px] flex-col">
        <section className="flex flex-col gap-3.5 px-5 pt-7 pb-4">
          <h1 className="text-center text-[30px] leading-[1.05] font-semibold tracking-[-0.5px]">
            Balloon Sale Benefiting Kirkland Middle School
          </h1>
          <p className="text-base">
            Pre-order your favorites and pick them up ready-made, or come by and we'll twist one for
            you on the spot.
          </p>
          <div className="mt-1.5 grid grid-cols-3 gap-2">
            <div className={infoTile}>
              <span className={cn(label, "text-[11px]")}>When</span>
              <strong className={infoValue}>{settings.event_date}</strong>
            </div>
            <div className={infoTile}>
              <span className={cn(label, "text-[11px]")}>Time</span>
              <strong className={infoValue}>{settings.event_time}</strong>
            </div>
            <div className={infoTile}>
              <span className={cn(label, "text-[11px]")}>Where</span>
              <a
                href={eventMapUrl(settings)}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(infoValue, "font-extrabold underline-offset-2")}
              >
                {settings.event_place}
              </a>
            </div>
          </div>
          {settings.event_address && (
            <p className="m-0 text-[14px] font-bold">
              Address:{" "}
              <a href={eventMapUrl(settings)} target="_blank" rel="noopener noreferrer">
                {settings.event_address}
              </a>
            </p>
          )}
        </section>

        <section className="px-5 py-4">
          <div className="flex flex-col gap-2.5 rounded-3xl bg-yellow-200 p-5">
            <div className="flex items-center gap-2">
              <MegaphoneIcon />
              <span className="text-[12px] font-extrabold tracking-[1.2px] text-blue-700 uppercase">
                Announcement
              </span>
            </div>
            {open ? (
              <p className="whitespace-pre-line">
                {splitOnPhrase(settings.announcement, settings.event_place).map((part, i) =>
                  part.match ? (
                    <a
                      key={i}
                      href={eventMapUrl(settings)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-blue-700 underline-offset-2 hover:text-blue-800"
                    >
                      {part.text}
                    </a>
                  ) : (
                    part.text
                  ),
                )}
              </p>
            ) : (
              <p>
                Pre-orders are closed. Come see us at the event — we'll twist balloons on the spot!
              </p>
            )}
            <Link
              to="/donate"
              className={cn(buttonVariants({ variant: "link" }), "self-start text-[15px]")}
            >
              See the donation steps <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        <section className="flex flex-col gap-2.5 px-5 py-4">
          <h2 className="text-[22px] font-semibold">How pre-ordering works</h2>
          <ol className="m-0 grid list-none grid-cols-3 gap-2 p-0">
            <li className={stepItem}>
              <span className={cn(stepNum, "bg-red-500")}>1</span>
              Pick your balloons
            </li>
            <li className={stepItem}>
              <span className={cn(stepNum, "bg-accent-700")}>2</span>
              {settings.venmo_handle
                ? "Donate to the school or pay on Venmo"
                : "Donate to the school & upload the receipt"}
            </li>
            <li className={stepItem}>
              <span className={cn(stepNum, "bg-ink")}>3</span>
              Pick them up at the event
            </li>
          </ol>
        </section>

        <section className="flex flex-col gap-3.5 px-5 pt-[22px] pb-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[22px] font-semibold">The balloon menu</h2>
            <span className="text-[13px] font-bold">Tap + to add</span>
          </div>
          <div className={menuGrid}>
            {items.map((i) => (
              <Tile key={i.id} item={i} />
            ))}
          </div>
        </section>

        <section className="px-5 pt-[22px] pb-4">
          <div className="flex items-start gap-3.5 rounded-[20px] border-2 border-dashed border-line-dashed bg-surface p-[18px]">
            <WrenchIcon />
            <div className="flex flex-col gap-1">
              <span className="text-[18px] font-semibold">Want something custom?</span>
              <span className="text-[14px]">
                Skip the pre-order and visit our table. We'll twist balloons on the spot while you
                wait, as long as supplies last.
              </span>
            </div>
          </div>
        </section>

        <footer className="flex flex-col gap-3 px-5 pt-4 pb-7 text-[13px]">
          <p>
            Balloon x Bros is a student fundraiser. Questions? Email{" "}
            <a href={`mailto:${settings.contact_email}`} className="underline">
              {settings.contact_email}
            </a>
          </p>
          <p>
            <strong>Warning:</strong> Children under 8 years can choke or suffocate on un-inflated
            or broken balloons. Adult supervision required. Keep un-inflated balloons from young
            children. Discard broken balloons at once. Made of natural rubber latex, which may cause
            allergies.
          </p>
        </footer>

        {open && (
          <div className="sticky bottom-0 mt-auto flex items-center gap-3 border-t border-line bg-surface px-5 pt-3.5 pb-[calc(18px+env(safe-area-inset-bottom))]">
            <div className="flex flex-1 flex-col">
              <span className={cn(label, "text-[12px]")}>Your order</span>
              <span className="font-extrabold" aria-live="polite">
                {count === 0 ? "Nothing yet" : `${count} balloon${count === 1 ? "" : "s"}`}
              </span>
            </div>
            <Link
              to="/order"
              className={cn(buttonVariants({ variant: "red", size: "md" }), "px-7")}
            >
              Order <ArrowRight />
            </Link>
          </div>
        )}
      </main>
    </>
  );
}
