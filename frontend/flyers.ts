import type { Flyer } from "../src/util/flyerTypes";
import { escapeHtml } from "./escapeHtml";

interface ShownFlyer {
  url: string;
  name: string;
}

let flyers: ShownFlyer[] = [];
let index = -1;

export function setFlyers(list: ShownFlyer[]): void {
  flyers = list;
  if (index >= flyers.length) index = -1;
}

export function flyersReady(): boolean {
  return flyers.length > 0;
}

// Called by the rotator just before the panel slides in: one flyer per turn
export function showNextFlyer(): void {
  const el = document.getElementById("flyers");
  if (!el || flyers.length === 0) return;
  index = (index + 1) % flyers.length;
  const flyer = flyers[index];
  // A blurred, darkened copy fills the panel; the flyer itself fits inside without stretching
  el.innerHTML = `<div class="flyer">
    <div class="flyer-bg" style="background-image:url('${flyer.url}')"></div>
    <img src="${flyer.url}" alt="${escapeHtml(flyer.name)}">
  </div>`;
  // Start downloading the next one now, so it's ready next turn
  const next = flyers[(index + 1) % flyers.length];
  if (next !== flyer) new Image().src = next.url;
}

export async function loadFlyers(): Promise<void> {
  try {
    const res = await fetch(`${window.location.origin}/api/flyers`);
    if (!res.ok) return; // keep the current list
    const list: Flyer[] = await res.json();
    setFlyers(list.map((f) => ({ url: `/api/flyers/${encodeURIComponent(f.id)}`, name: f.name })));
  } catch (err) {
    console.error("Flyer list update failed:", err);
  }
}
