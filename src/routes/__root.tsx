import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRoute,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import { LoadError, SiteHeader } from "../components/ui";
import { buttonVariants } from "../components/ui/button";
import { getMenuFn } from "../server-fns";
import { StoreProvider } from "../store";
import appCss from "../styles/app.css?url";

export const Route = createRootRoute({
  // Load the menu once, during SSR. After that the store refreshes it itself
  // (after an order, or on a stock conflict), so navigations don't refetch.
  loader: async () => {
    const menu = await getMenuFn();
    // The cause is already in the Worker log; keep it out of the page.
    if (!menu.ok) throw new Error("Menu unavailable.");
    return menu.data;
  },
  shouldReload: false,
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#F4F7FF" },
      {
        name: "description",
        content: "Pre-order twisted balloons made by kids to raise money for our school.",
      },
      { title: "Balloon x Bros — balloons for our school" },
    ],
    links: [
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Montserrat:wght@400;500;600;700;800&display=swap",
      },
      { rel: "stylesheet", href: appCss },
    ],
  }),
  shellComponent: RootDocument,
  component: RootComponent,
  // Any error no page catches lands here, server or client: a failed menu
  // load (e.g. D1 unavailable) or a page that throws while rendering.
  errorComponent: RootError,
  notFoundComponent: NotFound,
});

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const menu = Route.useLoaderData();
  return (
    <StoreProvider initialMenu={menu}>
      <Outlet />
    </StoreProvider>
  );
}

function RootError({ error }: ErrorComponentProps) {
  console.error(error);
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex min-h-screen w-full max-w-[640px] flex-col">
        <LoadError
          message="Something went wrong loading this page. Please try again in a moment."
          retry={() => window.location.reload()}
        />
      </main>
    </>
  );
}

function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[640px] flex-col gap-3.5 px-5 pt-20 pb-4 text-center">
      <h1 className="text-[34px] font-bold leading-[1.05] tracking-[-0.5px]">
        This balloon floated away
      </h1>
      <Link to="/" className={buttonVariants({ variant: "ink", size: "lg" })}>
        Back to home
      </Link>
    </main>
  );
}
