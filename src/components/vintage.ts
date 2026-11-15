// Vintage film look shared by the live preview (CSS) and the exported PNG (canvas).
// The CSS and canvas versions use the same numbers so the download matches the preview.

// Tuned toward faded sepia photobooth film: muted colour, warm cream highlights,
// lifted (milky) blacks, soft contrast, fine grain and a gentle burnt-edge vignette.
const SEPIA = 0.5;
const SATURATE = 0.6;
const CONTRAST = 0.86;
const BRIGHTNESS = 1.05;
const TINT = [232, 200, 160] as const;
const TINT_AMOUNT = 0.12;
const GRAIN = 20;
const VIGNETTE = "rgba(50,28,18,.38)";

export const VINTAGE_FILTER_CSS = `sepia(${SEPIA}) saturate(${SATURATE}) contrast(${CONTRAST}) brightness(${BRIGHTNESS})`;

const tintCss = `rgba(${TINT.join(",")},${TINT_AMOUNT})`;
export const VINTAGE_OVERLAY_CSS = `radial-gradient(ellipse at center, transparent 55%, ${VIGNETTE} 100%), linear-gradient(${tintCss}, ${tintCss})`;

export const GRAIN_URL = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`;

/** Applies the vintage film finish to one rectangle of an already-drawn canvas. */
export function applyVintage(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const x0 = Math.max(0, Math.floor(x));
  const y0 = Math.max(0, Math.floor(y));
  const w0 = Math.min(ctx.canvas.width - x0, Math.ceil(w));
  const h0 = Math.min(ctx.canvas.height - y0, Math.ceil(h));
  if (w0 <= 0 || h0 <= 0) return;

  const img = ctx.getImageData(x0, y0, w0, h0);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue;
    let r = d[i], g = d[i + 1], b = d[i + 2];

    const sr = 0.393 * r + 0.769 * g + 0.189 * b;
    const sg = 0.349 * r + 0.686 * g + 0.168 * b;
    const sb = 0.272 * r + 0.534 * g + 0.131 * b;
    r += (sr - r) * SEPIA; g += (sg - g) * SEPIA; b += (sb - b) * SEPIA;

    const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    r = l + (r - l) * SATURATE; g = l + (g - l) * SATURATE; b = l + (b - l) * SATURATE;

    r = ((r - 127.5) * CONTRAST + 127.5) * BRIGHTNESS;
    g = ((g - 127.5) * CONTRAST + 127.5) * BRIGHTNESS;
    b = ((b - 127.5) * CONTRAST + 127.5) * BRIGHTNESS;

    r += (TINT[0] - r) * TINT_AMOUNT; g += (TINT[1] - g) * TINT_AMOUNT; b += (TINT[2] - b) * TINT_AMOUNT;

    const n = (Math.random() - 0.5) * GRAIN;
    d[i] = r + n; d[i + 1] = g + n; d[i + 2] = b + n; // Uint8ClampedArray clamps + rounds
  }
  ctx.putImageData(img, x0, y0);

  // Elliptical vignette matching CSS `radial-gradient(ellipse at center, transparent 55%, …)`.
  ctx.save();
  ctx.beginPath();
  ctx.rect(x0, y0, w0, h0);
  ctx.clip();
  ctx.translate(x0 + w0 / 2, y0 + h0 / 2);
  ctx.scale(w0 / 2, h0 / 2);
  const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.SQRT2);
  grd.addColorStop(0, "rgba(50,28,18,0)");
  grd.addColorStop(0.55, "rgba(50,28,18,0)");
  grd.addColorStop(1, VIGNETTE);
  ctx.fillStyle = grd;
  ctx.fillRect(-1, -1, 2, 2);
  ctx.restore();
}
