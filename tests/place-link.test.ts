import { describe, expect, it } from "vite-plus/test";
import { eventMapUrl, mapsSearchUrl } from "../shared/place";
import { splitOnPhrase } from "../src/lib/place-link";

describe("place links", () => {
  it("builds an encoded Google Maps search URL", () => {
    expect(mapsSearchUrl("Kingsgate Skating Rink")).toBe(
      "https://www.google.com/maps/search/?api=1&query=Kingsgate%20Skating%20Rink",
    );
  });

  it("searches the event address, or the place name when there is none", () => {
    const place = "Kingsgate Skating Rink";
    expect(eventMapUrl({ event_place: place, event_address: "1 Main St" })).toBe(
      mapsSearchUrl("1 Main St"),
    );
    expect(eventMapUrl({ event_place: place, event_address: "" })).toBe(mapsSearchUrl(place));
  });

  it("splits text around every occurrence of the phrase", () => {
    expect(splitOnPhrase("Pickup at Rink on 11/13. Rink!", "Rink")).toEqual([
      { text: "Pickup at ", match: false },
      { text: "Rink", match: true },
      { text: " on 11/13. ", match: false },
      { text: "Rink", match: true },
      { text: "!", match: false },
    ]);
  });

  it("leaves text without the phrase, or with an empty phrase, whole", () => {
    expect(splitOnPhrase("Hi!", "Rink")).toEqual([{ text: "Hi!", match: false }]);
    expect(splitOnPhrase("Hi!", "")).toEqual([{ text: "Hi!", match: false }]);
  });
});
