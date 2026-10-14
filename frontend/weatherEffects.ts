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

  function applyCondition(condition: Condition, intensity: Intensity): void {
    const amount = condition === "storm" ? AMOUNT_FOR.heavy : AMOUNT_FOR[intensity];
    setEffect(EFFECT_FOR[condition], amount);
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
