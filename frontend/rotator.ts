export interface Panel {
  id: string;
  el: HTMLElement;
  durationMs: number;
  isReady(): boolean;
  refresh?(): void; // optional: called just before the panel is shown
}

const FALLBACK_RETRY_MS = 5_000;

export function startRotator(panels: Panel[], fallback: HTMLElement): void {
  let current: Panel | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const fallbackPanel: Panel = {
    id: "fallback",
    el: fallback,
    durationMs: FALLBACK_RETRY_MS,
    isReady: () => true,
  };

  function rotate(): void {
    let next: Panel | undefined;
    const start = panels.indexOf(current as Panel) + 1;
    for (let i = 0; i < panels.length; i++) {
      const candidate = panels[(start + i) % panels.length];
      if (candidate.isReady()) {
        next = candidate;
        break;
      }
    }
    next ??= fallbackPanel; // nothing ready → show the fallback

    if (next !== current) {
      next.refresh?.(); // let it update its content before it appears
      placeAtStart(next.el); // jump to the waiting spot (right side) instantly
      current?.el.classList.remove("is-active");
      current?.el.classList.add("is-leaving");
      next.el.classList.add("is-active");
      current = next;
    }
    clearTimeout(timer);
    timer = setTimeout(rotate, next.durationMs);
  }

  rotate();
}

function placeAtStart(el: HTMLElement) {
  el.classList.add("no-transition");
  el.classList.remove("is-active", "is-leaving");
  void el.offsetWidth; // forces the browser to apply the start position now
  el.classList.remove("no-transition");
}
