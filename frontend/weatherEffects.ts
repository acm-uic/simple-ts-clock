interface Drop {
    x: number;
    y: number;
    speed: number;
    length: number;
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

  const drops: Drop[] = Array.from({ length: 150 }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    speed: 700 + Math.random() * 400,
    length: 10 + Math.random() * 10,
  }));

  let lastTime = performance.now();

  function frame(now: number): void {
    const seconds = Math.min(0.1, (now - lastTime) / 1000);
    lastTime = now;

    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
    ctx.lineWidth = 1.5;

    for (const d of drops) {
        d.y += d.speed * seconds;
        if (d.y > height) {
            d.y = -d.length;
            d.x = Math.random() * width;
        }
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - 2, d.y + d.length);
        ctx.stroke();
    }

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);

  window.addEventListener("resize", () => {
    ctx = fitCanvas(canvas);
    ({ width, height } = canvas.getBoundingClientRect());
  });
}