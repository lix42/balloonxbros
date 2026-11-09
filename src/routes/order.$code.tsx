import { createFileRoute, notFound } from "@tanstack/react-router";
import { Done } from "../pages/Done";

export const Route = createFileRoute("/order/$code")({
  beforeLoad: ({ params }) => {
    if (!/^BXB-[A-Z0-9]+$/.test(params.code)) throw notFound();
  },
  component: DoneRoute,
});

function DoneRoute() {
  const { code } = Route.useParams();
  return <Done code={code} />;
}
