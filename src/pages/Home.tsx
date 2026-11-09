import { formatCents, type Item } from "../../shared/types";
import { ItemArt } from "../components/Glyph";
import { ArrowRight, LoadError, Loading, MegaphoneIcon, SiteHeader, WrenchIcon } from "../components/ui";
import { Link } from "../router";
import { useStore } from "../store";

function Tile({ item }: { item: Item }) {
  const { cart, add } = useStore();
  const inCart = cart[item.id]?.qty ?? 0;
  const limited = item.stock !== null;
  const soldOut = item.stock === 0;
  const atMax = limited && inCart >= (item.stock ?? 0);
  const tint = item.tint ?? "#E1EBFF";

  return (
    <div className={`tile${soldOut ? " soldout" : ""}`}>
      <div className="tile-art" style={{ background: tint }}>
        <ItemArt item={item} />
        {limited && (
          <span className={`badge ${soldOut ? "" : "yellow"}`}>{soldOut ? "Sold out" : `${item.stock} left`}</span>
        )}
        {inCart > 0 && (
          <span className="badge" style={limited ? { left: 8, right: "auto" } : undefined} aria-label={`${inCart} in your order`}>
            {inCart}
          </span>
        )}
        <button
          type="button"
          className="tile-add"
          onClick={() => add(item.id)}
          disabled={soldOut || atMax}
          aria-label={soldOut ? `${item.name} is sold out` : `Add ${item.name}`}
        >
          +
        </button>
      </div>
      <span className="tile-name">{item.name}</span>
      <span className="tile-price">{formatCents(item.priceCents)}</span>
    </div>
  );
}

export function Home() {
  const { items, settings, loadError, reload, count } = useStore();
  if (loadError) return <><SiteHeader /><LoadError message={loadError} retry={reload} /></>;
  if (!items || !settings) return <><SiteHeader /><Loading /></>;

  const menu = items.filter((i) => i.category === "menu");
  const limited = items.filter((i) => i.category === "limited");
  const open = settings.orders_open === "1";

  return (
    <>
      <SiteHeader />
      <main className="page">
        <section className="section stack gap-14" style={{ paddingTop: 28 }}>
          <p className="eyebrow">Fundraiser for {settings.school_name}</p>
          <h1 className="h1">Twisted balloons, made by kids, for our school.</h1>
          <p className="lede">
            Pre-order your favorites and pick them up ready-made, or come by and we'll twist one for you on the spot.
          </p>
          <div className="info-tiles">
            <div className="info-tile"><span className="label">When</span><strong>{settings.event_date}</strong></div>
            <div className="info-tile"><span className="label">Time</span><strong>{settings.event_time}</strong></div>
            <div className="info-tile"><span className="label">Where</span><strong>{settings.event_place}</strong></div>
          </div>
        </section>

        <section className="section">
          <div className="card-navy stack gap-10">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <MegaphoneIcon />
              <span className="label" style={{ color: "var(--yellow-on-navy)", fontSize: 12, letterSpacing: 1.2 }}>
                Announcement
              </span>
            </div>
            {open ? (
              <p>
                Pre-orders are open until {settings.cutoff}. You pay by donating straight to the school, so every
                dollar goes to {settings.purpose}.
              </p>
            ) : (
              <p>Pre-orders are closed. Come see us at the event — we'll twist balloons on the spot!</p>
            )}
            <Link href="/donate" className="link-btn" style={{ color: "#fff", fontSize: 15 }}>
              See the donation steps <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        <section className="section stack gap-10">
          <h2 className="h2">How pre-ordering works</h2>
          <ol className="steps-3">
            <li><span className="num" style={{ background: "var(--red)" }}>1</span>Pick your balloons</li>
            <li><span className="num" style={{ background: "var(--blue)" }}>2</span>Donate to the school &amp; upload the receipt</li>
            <li><span className="num" style={{ background: "var(--ink)" }}>3</span>Pick them up at the event</li>
          </ol>
        </section>

        <section className="section stack gap-14" style={{ paddingTop: 22 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
            <h2 className="h2">The balloon menu</h2>
            <span className="small" style={{ fontWeight: 700 }}>Tap + to add</span>
          </div>
          <div className="menu-grid">
            {menu.map((i) => <Tile key={i.id} item={i} />)}
          </div>
        </section>

        {limited.length > 0 && (
          <section className="section stack gap-14" style={{ paddingTop: 22 }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
              <h2 className="h2">Limited edition</h2>
              <span className="small" style={{ fontWeight: 700 }}>Only a few made</span>
            </div>
            <div className="menu-grid">
              {limited.map((i) => <Tile key={i.id} item={i} />)}
            </div>
          </section>
        )}

        <section className="section" style={{ paddingTop: 22 }}>
          <div className="custom-card">
            <WrenchIcon />
            <div className="stack" style={{ gap: 4 }}>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 18 }}>Want something custom?</span>
              <span style={{ fontSize: 14, color: "var(--ink-2)" }}>
                Skip the pre-order and visit our table. We'll twist balloons on the spot while you wait, as long as
                supplies last.
              </span>
            </div>
          </div>
        </section>

        <footer className="section small" style={{ paddingBottom: 28 }}>
          Balloon x Bros is a student fundraiser. Questions? Email{" "}
          <a href={`mailto:${settings.contact_email}`}>{settings.contact_email}</a>
        </footer>

        {open && (
          <div className="order-bar">
            <div className="stack" style={{ flex: 1 }}>
              <span className="label" style={{ fontSize: 12 }}>Your order</span>
              <span style={{ fontWeight: 800 }} aria-live="polite">
                {count === 0 ? "Nothing yet" : `${count} balloon${count === 1 ? "" : "s"}`}
              </span>
            </div>
            <Link href="/order" className="btn btn-red">
              Order <ArrowRight />
            </Link>
          </div>
        )}
      </main>
    </>
  );
}
