import { Link } from "@tanstack/react-router";
import { cn } from "cn";
import { formatCents, type Item } from "../../shared/types";
import { ItemArt } from "../components/Glyph";
import { ArrowRight, LoadError, MegaphoneIcon, SiteHeader, WrenchIcon } from "../components/ui";
import { buttonVariants } from "../components/ui/button";
import { eventMapUrl } from "../../shared/place";
import { splitOnPhrase } from "../lib/place-link";
import { useStore } from "../store";

const badge =
  "absolute top-2 inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full px-[7px] text-[12px] font-extrabold";
const label = "font-extrabold tracking-[0.8px] text-muted uppercase";
const stepItem = "flex flex-col gap-1.5 text-[13px] leading-[1.35] font-bold";
const stepNum =
  "inline-flex size-7 shrink-0 items-center justify-center rounded-full text-[14px] font-extrabold text-white";
const infoTile = "flex flex-col gap-0.5 rounded-xl border border-line bg-surface p-3";
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
    <div className="flex flex-col gap-1.5">
      <div
        className={cn(
          "relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl [&_img]:size-full [&_img]:object-cover [&>svg]:h-auto [&>svg]:w-[64%]",
          soldOut && "bg-line-strong [&_img]:opacity-35 [&_svg]:opacity-35",
        )}
        style={soldOut ? undefined : { background: tint }}
      >
        <ItemArt item={item} />
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
      <span className={cn("text-[13px] font-bold text-muted", soldOut && "line-through")}>
        {formatCents(item.priceCents)}
      </span>
    </div>
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

  const menu = items.filter((i) => i.category === "menu");
  const limited = items.filter((i) => i.category === "limited");
  const open = settings.orders_open === "1";

  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex min-h-screen w-full max-w-[640px] flex-col">
        <section className="flex flex-col gap-3.5 px-5 pt-7 pb-4">
          <p className="text-[13px] font-extrabold tracking-[1.2px] text-red-600 uppercase">
            Fundraiser for {settings.school_name}
          </p>
          <h1 className="text-[40px] leading-[1.05] font-bold tracking-[-0.5px]">
            Twisted balloons, made by kids, for our school.
          </h1>
          <p className="text-base text-ink-2">
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
                className={cn(infoValue, "font-extrabold text-link underline underline-offset-2")}
              >
                {settings.event_place}
              </a>
            </div>
          </div>
          {settings.event_address && (
            <p className="m-0 text-[14px] font-bold text-ink-2">
              Address:{" "}
              <a href={eventMapUrl(settings)} target="_blank" rel="noopener noreferrer">
                {settings.event_address}
              </a>
            </p>
          )}
        </section>

        <section className="px-5 py-4">
          <div className="flex flex-col gap-2.5 rounded-3xl bg-ink p-5 text-white [&_a]:text-white">
            <div className="flex items-center gap-2">
              <MegaphoneIcon />
              <span className="text-[12px] font-extrabold tracking-[1.2px] text-yellow-300 uppercase">
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
                      className="font-bold underline underline-offset-2"
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
              className={cn(
                buttonVariants({ variant: "link" }),
                "text-[15px] text-white hover:text-white",
              )}
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
              Donate to the school &amp; upload the receipt
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
            <span className="text-[13px] font-bold text-muted">Tap + to add</span>
          </div>
          <div className={menuGrid}>
            {menu.map((i) => (
              <Tile key={i.id} item={i} />
            ))}
          </div>
        </section>

        {limited.length > 0 && (
          <section className="flex flex-col gap-3.5 px-5 pt-[22px] pb-4">
            <div className="flex items-baseline justify-between">
              <h2 className="text-[22px] font-semibold">Limited edition</h2>
              <span className="text-[13px] font-bold text-muted">Only a few made</span>
            </div>
            <div className={menuGrid}>
              {limited.map((i) => (
                <Tile key={i.id} item={i} />
              ))}
            </div>
          </section>
        )}

        <section className="px-5 pt-[22px] pb-4">
          <div className="flex items-start gap-3.5 rounded-[20px] border-2 border-dashed border-line-dashed bg-surface p-[18px]">
            <WrenchIcon />
            <div className="flex flex-col gap-1">
              <span className="font-heading text-[18px] font-semibold">Want something custom?</span>
              <span className="text-[14px] text-ink-2">
                Skip the pre-order and visit our table. We'll twist balloons on the spot while you
                wait, as long as supplies last.
              </span>
            </div>
          </div>
        </section>

        <footer className="px-5 pt-4 pb-7 text-[13px] text-muted">
          Balloon x Bros is a student fundraiser. Questions? Email{" "}
          <a href={`mailto:${settings.contact_email}`} className="underline">
            {settings.contact_email}
          </a>
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
