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
import { getMenu } from "../menu";
import { StoreProvider } from "../store";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
  // Load the menu once, during SSR. After that the store refreshes it itself
  // (after an order, or on a stock conflict), so navigations don't refetch.
  loader: () => getMenu(),
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
        href: "https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Nunito:wght@400;600;700;800&display=swap",
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
      <main className="page">
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
    <main className="page section stack gap-14" style={{ paddingTop: 80, textAlign: "center" }}>
      <h1 className="h1 sm">This balloon floated away</h1>
      <Link to="/" className="btn btn-ink">
        Back to home
      </Link>
    </main>
  );
}
