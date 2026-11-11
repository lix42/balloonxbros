import { Link, useSearch } from "@tanstack/react-router";
import { cn } from "cn";
import type { ReactNode } from "react";
import { formatCents, VENMO_NOTE, venmoPayUrl } from "../../shared/types";
import { ArrowRight, LoadError, SiteHeader } from "../components/ui";
import { buttonVariants } from "../components/ui/button";
import { SCHOOL_SITE } from "../lib/school-site";
import { useStore } from "../store";

const stepNum =
  "inline-flex size-[34px] shrink-0 items-center justify-center rounded-full font-heading text-[17px] font-semibold text-white";

type StepImageProps = { src: string; width: number; height: number; alt: string };
type Step = { title: string; body: ReactNode; image?: StepImageProps };

function StepImage({ src, width, height, alt }: StepImageProps) {
  return (
    <img
      src={src}
      width={width}
      height={height}
      alt={alt}
      loading="lazy"
      className="mt-2 block h-auto w-full rounded-xl border border-line bg-white"
      style={{ maxWidth: width }}
    />
  );
}

export function Donate() {
  const { settings, loadError, reload } = useStore();
  // The order page passes its total; arriving any other way, the amount is unknown.
  const { total } = useSearch({ from: "/donate" });
  if (loadError)
    return (
      <>
        <SiteHeader />
        <LoadError message={loadError} retry={reload} />
      </>
    );

  const amount = total ? formatCents(total) : "your order total";

  const steps: Step[] = [
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
      title: "Fill in the donation form",
      body: (
        <>
          <ul className="m-0 list-none p-0 leading-[1.7]">
            {[
              ["School", SCHOOL_SITE.school],
              ["I want to donate to", SCHOOL_SITE.fund],
              ["Donation amount", amount],
              ["Student Name", SCHOOL_SITE.student],
            ].map(([field, value]) => (
              <li key={field}>
                {field}: <strong>{value}</strong>
              </li>
            ))}
          </ul>
          Then tap <strong>Buy</strong>. The form clears, but the green <strong>Cart</strong> bar at
          the top now shows your amount. Tap it.
        </>
      ),
      image: {
        src: "/donate/form.jpg",
        width: 251,
        height: 262,
        alt: "The donation form filled in with Kirkland Middle School, ASB Donations and Student Name Sky Xu.",
      },
    },
    {
      title: "Check your cart, then tap Pay",
      body: (
        <>
          Check the school, fund, student name and amount, then tap <strong>Pay</strong>. Something
          wrong? Tap <strong>Remove</strong> and start again.
        </>
      ),
      image: {
        src: "/donate/cart.jpg",
        width: 251,
        height: 180,
        alt: "The cart: Kirkland Middle School, ASB Donations, Sky Xu, $10.00, with a Pay button.",
      },
    },
    {
      title: "Enter your details",
      body: (
        <>
          Name, address, phone and email are all required. Then tap <strong>Pay</strong>.
        </>
      ),
      image: {
        src: "/donate/details.jpg",
        width: 251,
        height: 280,
        alt: "The Customer Information form: name, address, phone and email.",
      },
    },
    {
      title: "Pay by card",
      body: (
        <>
          Visa or Mastercard only. Enter your card and tap <strong>Pay {amount}</strong>.
        </>
      ),
      image: {
        src: "/donate/card.jpg",
        width: 251,
        height: 355,
        alt: "The Payment Information form: cardholder name, card number, expiry date and CVV.",
      },
    },
  ];

  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex min-h-screen w-full max-w-[640px] flex-col">
        <section className="flex flex-col gap-2.5 px-5 pt-[26px] pb-4">
          <p className="text-[13px] font-extrabold tracking-[1.2px] text-red-600 uppercase">
            Paying for your order
          </p>
          <h1 className="text-[34px] leading-[1.05] font-bold tracking-[-0.5px]">
            How to donate to the school
          </h1>
          {settings.venmo_handle && (
            <div className="flex flex-col gap-2 rounded-2xl border border-line bg-surface p-4">
              <span className="font-extrabold">Rather pay with Venmo?</span>
              <span className="text-[14px]">
                Send {amount} to{" "}
                <a
                  href={venmoPayUrl(settings.venmo_handle, total ?? null, VENMO_NOTE)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold underline"
                >
                  @{settings.venmo_handle}
                </a>{" "}
                instead and skip the steps below.
                {!total && " Type the amount in Venmo yourself."} No receipt needed: on the order
                form, choose Venmo and type your Venmo username.
              </span>
            </div>
          )}
          <p className="text-base">
            Your donation goes straight to {settings.school_name}, and your receipt is your ticket
            for picking up the balloons.
          </p>
          <p className="rounded-[16px] border-2 border-yellow-500 bg-yellow-100 px-4 py-3 text-[14px]">
            <strong>Heads up:</strong> the school's site shows your receipt only once, right after
            you pay. Save it before you tap Done (step 6).
          </p>
        </section>

        <ol className="m-0 flex list-none flex-col gap-2.5 px-5 py-4">
          {steps.map((s, i) => (
            <li
              key={s.title}
              className="flex gap-3.5 rounded-2xl border border-line bg-surface p-4"
            >
              <span className={cn(stepNum, "bg-ink")}>{i + 1}</span>
              <div className="flex min-w-0 flex-col gap-1">
                <span className="font-extrabold">{s.title}</span>
                <div className="text-[14px]">{s.body}</div>
                {s.image && <StepImage {...s.image} />}
              </div>
            </li>
          ))}
          <li className="flex gap-3.5 rounded-2xl border-2 border-yellow-500 bg-yellow-100 p-4">
            <span className={cn(stepNum, "bg-red-500")}>6</span>
            <div className="flex min-w-0 flex-col gap-1.5">
              <span className="font-extrabold">Save your receipt before you tap Done</span>
              <span className="text-[14px]">
                This page is your <strong>only</strong> receipt: once you tap Done, it's gone. Any
                one of these works:
              </span>
              <ul className="m-0 list-[circle] pl-[18px] text-[14px] leading-[1.7]">
                <li>Take a screenshot of the receipt</li>
                <li>
                  Tap <strong>Print</strong> and save it as a PDF
                </li>
                <li>
                  Type your email and tap <strong>Send</strong>. It comes from
                  noreply@intouchpay.com (check spam); screenshot or save that email.
                </li>
              </ul>
              <StepImage
                src="/donate/receipt.jpg"
                width={262}
                height={357}
                alt="The receipt page with Send, Print and Done buttons, showing ASB Donations, Sky Xu and $10.00. Personal details are blocked out."
              />
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
