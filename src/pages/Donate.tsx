import { Link } from "@tanstack/react-router";
import { cn } from "cn";
import { formatCents } from "../../shared/types";
import { ArrowRight, BackHeader, LoadError } from "../components/ui";
import { buttonVariants } from "../components/ui/button";
import { useStore } from "../store";

const stepNum =
  "inline-flex size-[34px] shrink-0 items-center justify-center rounded-full font-heading text-[17px] font-semibold text-white";

export function Donate() {
  const { settings, loadError, reload, totalCents, count } = useStore();
  if (loadError)
    return (
      <>
        <BackHeader to="/" label="Back to home">
          <>
            Balloon <span className="text-red">×</span> Bros
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
          className="text-[14px] font-bold break-all underline"
        >
          {settings.donation_url}
        </a>
      ),
    },
    {
      title: "Select the school",
      body: (
        <>
          Choose <strong className="text-ink">{settings.school_name}</strong> from the list.
        </>
      ),
    },
    {
      title: "Enter your order total",
      body: (
        <>
          Type <strong className="text-ink">{amount}</strong>. Rounding up is always welcome.
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
          Balloon <span className="text-red">×</span> Bros
        </>
      </BackHeader>
      <main className="mx-auto flex min-h-screen w-full max-w-[640px] flex-col">
        <section className="flex flex-col gap-2.5 px-5 pt-[26px] pb-4">
          <p className="text-[13px] font-extrabold tracking-[1.2px] text-red-text uppercase">
            Paying for your order
          </p>
          <h1 className="text-[34px] leading-[1.05] font-bold tracking-[-0.5px]">
            How to donate to the school
          </h1>
          <p className="text-base text-ink-2">
            We don't take payments ourselves. Your donation goes straight to {settings.school_name},
            and your receipt is your ticket for picking up the balloons.
          </p>
        </section>

        <ol className="m-0 flex list-none flex-col gap-2.5 px-5 py-4">
          {steps.map((s, i) => (
            <li
              key={s.title}
              className="flex gap-3.5 rounded-2xl border border-line bg-surface p-4"
            >
              <span className={cn(stepNum, "bg-ink")}>{i + 1}</span>
              <div className="flex flex-col gap-1">
                <span className="font-extrabold">{s.title}</span>
                <span className="text-[14px] text-ink-2">{s.body}</span>
              </div>
            </li>
          ))}
          <li className="flex gap-3.5 rounded-2xl border-2 border-yellow bg-yellow-tint p-4">
            <span className={cn(stepNum, "bg-red")}>6</span>
            <div className="flex flex-col gap-1.5">
              <span className="font-extrabold">Save your receipt</span>
              <span className="text-[14px] text-[#3d3420]">Any one of these works:</span>
              <ul className="m-0 list-[circle] pl-[18px] text-[14px] leading-[1.7] text-[#3d3420]">
                <li>Take a screenshot of the confirmation</li>
                <li>Print or save the page as a PDF</li>
                <li>Email the receipt to yourself and download it</li>
              </ul>
            </div>
          </li>
        </ol>

        <section className="flex flex-col gap-2.5 px-5 pt-4 pb-9">
          <Link
            to="/order"
            className={cn(
              buttonVariants({ variant: "red", size: "lg", block: true }),
              "whitespace-normal",
            )}
          >
            I've donated: upload my receipt <ArrowRight />
          </Link>
          <Link
            to="/"
            className={cn(buttonVariants({ variant: "link" }), "justify-center text-[15px]")}
          >
            Back to the balloon menu
          </Link>
        </section>
      </main>
    </>
  );
}
