type Effect = "rain" | "snow" | "none";
const CONDITIONS = ["clear", "cloudy", "rain", "snow", "storm", "fog"] as const;
const INTENSITIES = ["light", "normal", "heavy"] as const;

import type { Condition, Intensity, Weather } from "../src/util/weatherTypes";

const EFFECT_FOR: Record<Condition, Effect> = {
  clear: "none",
  cloudy: "none",
  rain: "rain",
  snow: "snow",
  storm: "rain",
  fog: "none",
};

const AMOUNT_FOR: Record<Intensity, number> = {
  light: 0.5, // half the particles
  normal: 1,
  heavy: 2.5,
};

// Chase said we should have lightning so now we have lightning
// Lightning (storms only). Kept rare and dim: flashing content can trigger seizures.
const STRIKE_MIN_S = 15; // shortest gap between strikes, seconds
const STRIKE_MAX_S = 40; // longest gap
const FLASH_PEAK = 0.25; // opacity at a strike (never full white)
const FLICKER_PEAK = 0.15; // the optional second flicker is weaker
const FLICKER_CHANCE = 1 / 3; // how often a strike flickers twice
const FLICKER_DELAY_S = 0.4; // gap between strike and flicker
const FLASH_FADE_S = 0.3; // how long a flash takes to fade from peak to 0

interface Particle {
  x: number;
  y: number;
  speed: number; // falling speed, units/s
  size: number; // streak len for rain, dot radius for snow
  drift: number; // sideways speed, units/s
}

// Set by startWeatherEffects; lets showWeather reach the running animation
let applyWeather: ((w: Weather) => void) | undefined;

export function showWeather(w: Weather): void {
  applyWeather?.(w);
}

export function fitCanvas(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ratio = window.devicePixelRatio || 1;
  const { width, height } = canvas.getBoundingClientRect();
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no 2d context");
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  return ctx;
}

export function startWeatherEffects(): void {
  const canvas = document.getElementById("sky-canvas") as HTMLCanvasElement;
  let ctx = fitCanvas(canvas);
  let { width, height } = canvas.getBoundingClientRect();

  let effect: Effect = "rain";
  let particles: Particle[] = [];
  let condition: Condition = "clear";

  // A random wait between strikes
  function randomGap(): number {
    return STRIKE_MIN_S + Math.random() * (STRIKE_MAX_S - STRIKE_MIN_S);
  }

  let flash = 0;
  let untilStrike = randomGap();
  let untilFlicker: number | undefined;

  // anywhere = true: random y (for filling the screen at the start)
  // anywhere = false: just above the top (for recycling)
  function makeParticle(anywhere: boolean): Particle {
    if (effect === "snow") {
      const size = 1.5 + Math.random() * 2;
      return {
        x: Math.random() * width,
        y: anywhere ? Math.random() * height : -size,
        speed: 40 + Math.random() * 50,
        size,
        drift: -20 + Math.random() * 40,
      };
    }
    const size = 10 + Math.random() * 10;
    return {
      x: Math.random() * width,
      y: anywhere ? Math.random() * height : -size,
      speed: 700 + Math.random() * 400,
      size,
      drift: 0,
    };
  }

  function setEffect(next: Effect, amount = 1): void {
    const count = Math.round((next === "rain" ? 150 : next === "snow" ? 120 : 0) * amount);
    if (next === effect && count === particles.length) return;
    effect = next;
    particles = Array.from({ length: count }, () => makeParticle(true));
  }

  function applyCondition(next: Condition, intensity: Intensity): void {
    condition = next;
    const amount = next === "storm" ? AMOUNT_FOR.heavy : AMOUNT_FOR[intensity];
    setEffect(EFFECT_FOR[next], amount);
  }

  function lightning(seconds: number): void {
    // 1. No storm: no lightning, and forget any planned flicker
    if (condition !== "storm") {
      flash = 0;
      untilFlicker = undefined;
      return;
    }

    // 2. Count down to the next strike
    untilStrike -= seconds;
    if (untilStrike <= 0) {
      flash = FLASH_PEAK;
      untilStrike = randomGap();
      if (Math.random() < FLICKER_CHANCE) untilFlicker = FLICKER_DELAY_S;
    }

    // 3. Count down to a planned flicker
    if (untilFlicker !== undefined) {
      untilFlicker -= seconds;
      if (untilFlicker <= 0) {
        flash = Math.max(flash, FLICKER_PEAK);
        untilFlicker = undefined;
      }
    }

    // 4. Draw the flash, then fade it
    if (flash > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${flash})`;
      ctx.fillRect(0, 0, width, height);
      flash = Math.max(0, flash - (FLASH_PEAK / FLASH_FADE_S) * seconds);
    }
  }

  let lastTime = performance.now();

  function frame(now: number): void {
    const seconds = Math.min(0.1, (now - lastTime) / 1000);
    lastTime = now;

    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
    ctx.lineWidth = 1.5;
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    for (const p of particles) {
      p.y += p.speed * seconds;
      p.x += p.drift * seconds;
      if (p.y > height) Object.assign(p, makeParticle(false));
      ctx.beginPath();
      if (effect === "snow") {
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - 2, p.y + p.size);
        ctx.stroke();
      }
    }
    lightning(seconds);

    requestAnimationFrame(frame);
  }

  const params = new URLSearchParams(window.location.search);
  const forced = CONDITIONS.find((c) => c === params.get("wx"));
  const forcedIntensity = INTENSITIES.find((i) => i === params.get("wxi")) ?? "normal";
  applyCondition(forced ?? "clear", forcedIntensity);

  applyWeather = (w) => {
    if (forced) return; // ?wx= overrides the real weather while testing
    applyCondition(w.condition, w.intensity);
  };

  requestAnimationFrame(frame);

  window.addEventListener("resize", () => {
    ctx = fitCanvas(canvas);
    ({ width, height } = canvas.getBoundingClientRect());
  });
}
