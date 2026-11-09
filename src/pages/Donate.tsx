import { Link } from "@tanstack/react-router";
import { formatCents } from "../../shared/types";
import { ArrowRight, BackHeader, LoadError } from "../components/ui";
import { useStore } from "../store";

export function Donate() {
  const { settings, loadError, reload, totalCents, count } = useStore();
  if (loadError)
    return (
      <>
        <BackHeader to="/" label="Back to home">
          <>
            Balloon <span className="x">×</span> Bros
          </>
        </BackHeader>
        <LoadError message={loadError} retry={reload} />
      </>
    );

  const amount = count > 0 ? formatCents(totalCents) : "your order total";

  const steps = [
    {
      title: "Open the school's donation page",
      body: (
        <a
          href={settings.donation_url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontWeight: 700, fontSize: 14, wordBreak: "break-all" }}
        >
          {settings.donation_url}
        </a>
      ),
    },
    {
      title: "Select the school",
      body: (
        <>
          Choose <strong style={{ color: "var(--ink)" }}>{settings.school_name}</strong> from the
          list.
        </>
      ),
    },
    {
      title: "Enter your order total",
      body: (
        <>
          Type <strong style={{ color: "var(--ink)" }}>{amount}</strong>. Rounding up is always
          welcome.
        </>
      ),
    },
    { title: "Submit", body: "Check the school and amount, then submit the form." },
    { title: "Pay", body: "Finish the payment on the school's page." },
  ];

  return (
    <>
      <BackHeader to="/" label="Back to home">
        <>
          Balloon <span className="x">×</span> Bros
        </>
      </BackHeader>
      <main className="page">
        <section className="section stack gap-10" style={{ paddingTop: 26 }}>
          <p className="eyebrow">Paying for your order</p>
          <h1 className="h1 sm">How to donate to the school</h1>
          <p className="lede">
            We don't take payments ourselves. Your donation goes straight to {settings.school_name},
            and your receipt is your ticket for picking up the balloons.
          </p>
        </section>

        <ol className="section stack gap-10" style={{ margin: 0, listStyle: "none" }}>
          {steps.map((s, i) => (
            <li key={s.title} className="step-card">
              <span className="num lg" style={{ background: "var(--ink)" }}>
                {i + 1}
              </span>
              <div className="stack" style={{ gap: 4 }}>
                <span style={{ fontWeight: 800 }}>{s.title}</span>
                <span style={{ fontSize: 14, color: "var(--ink-2)" }}>{s.body}</span>
              </div>
            </li>
          ))}
          <li className="step-card highlight">
            <span className="num lg" style={{ background: "var(--red)" }}>
              6
            </span>
            <div className="stack gap-6">
              <span style={{ fontWeight: 800 }}>Save your receipt</span>
              <span style={{ fontSize: 14, color: "#3D3420" }}>Any one of these works:</span>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: 18,
                  fontSize: 14,
                  lineHeight: 1.7,
                  color: "#3D3420",
                }}
              >
                <li>Take a screenshot of the confirmation</li>
                <li>Print or save the page as a PDF</li>
                <li>Email the receipt to yourself and download it</li>
              </ul>
            </div>
          </li>
        </ol>

        <section className="section stack gap-10" style={{ paddingBottom: 36 }}>
          <Link to="/order" className="btn btn-red btn-block">
            I've donated: upload my receipt <ArrowRight />
          </Link>
          <Link to="/" className="link-btn" style={{ justifyContent: "center", fontSize: 15 }}>
            Back to the balloon menu
          </Link>
        </section>
      </main>
    </>
  );
}
