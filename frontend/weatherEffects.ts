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

  function draw(): void {
    // TEMP: a test rectangle to check sharpness and size
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, 200, 100);
  }

  draw();
  window.addEventListener("resize", () => {
    ctx = fitCanvas(canvas);
    draw();
  });
}