import { createFileRoute } from "@tanstack/react-router";
import { parseDonateSearch } from "../lib/donate-search";
import { Donate } from "../pages/Donate";

export const Route = createFileRoute("/donate")({
  validateSearch: parseDonateSearch,
  component: Donate,
});
