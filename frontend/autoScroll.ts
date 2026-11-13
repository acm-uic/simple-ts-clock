const PIXELS_PER_SECOND = 60; // scroll speed
const PAUSE_MS = 2500; // the shortest rest at the top and at the bottom of each pass

interface Scroll {
  overflow: number;
  passMs: number;
  animation: Animation;
}
const scrolls = new WeakMap<HTMLElement, Scroll>();

// When `content` is taller than `frame`, slide it down and back up forever so the
// hidden rows get their turn: rest at the top, slide, rest at the bottom, and back.
// Gives back how long one pass (top to bottom) takes in milliseconds, or 0 when
// everything fits. A pass lasts at least `minPassMs`; `restart` begins again from the top.
export function scrollToFit(frame: HTMLElement, content: HTMLElement, minPassMs = 0, restart = false): number {
  const overflow = Math.max(0, Math.ceil(content.offsetHeight - frame.clientHeight));
  const current = scrolls.get(content);
  if (current?.overflow === overflow && !restart) return current.passMs; // nothing changed: leave it running

  current?.animation.cancel();
  scrolls.delete(content);
  if (overflow === 0) return 0;

  const travelMs = (overflow / PIXELS_PER_SECOND) * 1000;
  const passMs = Math.max(minPassMs, travelMs + 2 * PAUSE_MS);
  const rest = (passMs - travelMs) / 2 / passMs; // the share of a pass spent resting at each end
  const top = "translateY(0)";
  const bottom = `translateY(-${overflow}px)`;
  const animation = content.animate(
    [
      { transform: top },
      { transform: top, offset: rest, easing: "ease-in-out" },
      { transform: bottom, offset: 1 - rest },
      { transform: bottom },
    ],
    { duration: passMs, iterations: Number.POSITIVE_INFINITY, direction: "alternate" },
  );
  scrolls.set(content, { overflow, passMs, animation });
  return passMs;
}
