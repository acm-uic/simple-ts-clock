import type { TickerItem } from "../src/util/tickerTypes";
import { escapeHtml } from "./escapeHtml";

const PIXELS_PER_SECOND = 90; // scroll speed, the same however long the text is

const SOURCE_LABEL: Record<TickerItem["source"], string> = {
  weather: "Weather",
  cta: "CTA",
  github: "GitHub",
};

// Always shown, after the live items
const CONTRIBUTE: TickerItem = {
  source: "github",
  level: "info",
  text: "Contribute to this clock: github.com/acm-uic/simple-ts-clock",
  time: 0,
};

// The content twice in a row; sliding left by exactly one copy loops seamlessly
export function renderTicker(items: TickerItem[]): string {
  const copy = [...items, CONTRIBUTE]
    .map(
      (i) =>
        `<span class="ticker-item ${i.level}"><span class="ticker-source">${SOURCE_LABEL[i.source]}</span>${escapeHtml(i.text)}</span>`,
    )
    .join("");
  return `<div class="ticker-track"><div class="ticker-copy">${copy}</div><div class="ticker-copy" aria-hidden="true">${copy}</div></div>`;
}

// Duration = one copy's width ÷ speed, so long and short content scroll equally fast
export function fitTicker(): void {
  const track = document.querySelector<HTMLElement>("#messages .ticker-track");
  const copy = track?.querySelector<HTMLElement>(".ticker-copy");
  if (!track || !copy) return;
  track.style.setProperty("--ticker-duration", `${copy.offsetWidth / PIXELS_PER_SECOND}s`);
}

// New content waits for the loop to restart, so the text never jumps mid-scroll
let pending: string | undefined;

function show(html: string): void {
  const el = document.getElementById("messages");
  if (!el) return;
  if (!el.querySelector(".ticker-track")) {
    el.innerHTML = html;
    fitTicker();
  } else {
    pending = html;
  }
}

document.getElementById("messages")?.addEventListener("animationiteration", () => {
  if (pending === undefined) return;
  document.getElementById("messages")!.innerHTML = pending;
  pending = undefined;
  fitTicker();
});

export async function getMessages(): Promise<void> {
  const { origin } = window.location;
  const latLong = new URLSearchParams(window.location.search).get("weatherLatLong") ?? "";
  try {
    const res = await fetch(`${origin}/api/messages?weatherLatLong=${latLong}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const items: TickerItem[] = await res.json();
    show(renderTicker(items));
  } catch (err) {
    console.error("Ticker update failed:", err);
    // Keep what's on screen; if nothing is there yet, show the permanent line
    if (!document.querySelector("#messages .ticker-track")) show(renderTicker([]));
  }
}
