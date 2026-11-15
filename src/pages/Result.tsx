import { useEffect, useMemo, useRef } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { templates } from "../components/template";
import { themeVars, useThemeBody } from "../components/theme";
import { applyVintage } from "../components/vintage";

type Photo = { id: string; dataURL: string };
type LocationState = { photos?: Photo[] };

const PREVIEW_MAX_W = 280; 
const PREVIEW_MAX_H = 900; 

export default function Result() {
  const { templateId } = useParams<{ templateId: string }>();
  const { state } = useLocation() as { state?: LocationState };

  const tpl = useMemo(
    () => templates.find(t => t.id === templateId) ?? templates[0],
    [templateId]
  );

  const shots: Photo[] = useMemo(
    () => (state?.photos ?? []).slice(0, tpl.slots.length),
    [state?.photos, tpl.slots.length]
  );

  useThemeBody(tpl.theme);
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const buildCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!tpl || !buildCanvasRef.current) return;

    const build = buildCanvasRef.current;
    build.width = tpl.size.w;
    build.height = tpl.size.h;
    const ctx = build.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    let cancelled = false;

    (async () => {
      ctx.clearRect(0, 0, build.width, build.height);

      for (let i = 0; i < tpl.slots.length; i++) {
        const shot = shots[i];
        if (!shot) continue;

        const img = await loadImg(shot.dataURL);
        if (cancelled) return;

        const s = tpl.slots[i];
        const x = (s.x / 100) * build.width;
        const y = (s.y / 100) * build.height;
        const w = (s.w / 100) * build.width;
        const h = (s.h / 100) * build.height;

        const rImg = img.width / img.height;
        const rSlot = w / h;
        let dw = w, dh = h, dx = x, dy = y;
        if (rImg > rSlot) { dh = h; dw = h * rImg; dx = x - (dw - w) / 2; }
        else { dw = w; dh = w / rImg; dy = y - (dh - h) / 2; }

        if (s.r) { roundRect(ctx, x, y, w, h, s.r); ctx.save(); ctx.clip(); }
        ctx.drawImage(img, dx, dy, dw, dh);
        if (s.r) ctx.restore();
        if (tpl.look === "vintage") applyVintage(ctx, x, y, w, h);
      }

      const frame = await loadImg(tpl.frame);
      if (cancelled) return;
      ctx.drawImage(frame, 0, 0, build.width, build.height);

      if (previewCanvasRef.current) {
        const prev = previewCanvasRef.current;
        const scale = Math.min(PREVIEW_MAX_W / build.width, PREVIEW_MAX_H / build.height);
        prev.width = Math.round(build.width * scale);
        prev.height = Math.round(build.height * scale);

        const pctx = prev.getContext("2d");
        if (pctx) {
          pctx.clearRect(0, 0, prev.width, prev.height);
          pctx.drawImage(build, 0, 0, prev.width, prev.height);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [tpl, shots]);

  const noPhotos = shots.length === 0;
  const vintage = tpl.look === "vintage";

  const download = () => {
    const url = buildCanvasRef.current?.toDataURL("image/png");
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = `${tpl.name.replace(/\s+/g, "_")}.png`;
    a.click();
  };

  return (
    <main style={{ position: "relative", minHeight: "100dvh", color: "var(--ink)", fontFamily: "var(--body)", overflowX: "hidden", ...themeVars(tpl.theme) }}>
      <style>{`
        .rs-slot { width: min(${PREVIEW_MAX_W + 40}px, 82vw); height: 16px; border-radius: 10px; margin: 0 auto;
          background: linear-gradient(#12060a, #2a0f17); box-shadow: inset 0 3px 6px rgba(0,0,0,.8), 0 1px 0 rgba(255,255,255,.12); position: relative; z-index: 2; }
        .rs-print-clip { overflow: hidden; margin-top: -8px; padding: 0 12px 24px; }
        .rs-print { animation: rs-eject 1.6s cubic-bezier(.22,.9,.24,1) both, rs-develop 3.2s ease-out .9s both; }
        @keyframes rs-eject { from { transform: translateY(-102%); } to { transform: translateY(0); } }
        @keyframes rs-develop {
          from { filter: sepia(1) brightness(1.55) contrast(.45) saturate(.3) blur(1.5px); }
          to { filter: none; }
        }
        .rs-btn { box-sizing: border-box; border: none; border-radius: 14px; padding: 0 22px; height: 52px; font: 700 15px var(--body); cursor: pointer; text-decoration: none; touch-action: manipulation; display: inline-flex; align-items: center; justify-content: center; }
        @media (prefers-reduced-motion: reduce) { .rs-print { animation: none; } }
      `}</style>

      {/* fixed bg */}
      <div style={{
        position: "fixed", inset: 0,
        background: tpl.theme ? "var(--bg)" : "url('/background.png') center/cover no-repeat",
        zIndex: -1, pointerEvents: "none",
      }} />

      {/* header */}
      <header style={{
        display: "grid", placeItems: "center",
        paddingTop: "calc(16px + env(safe-area-inset-top))", paddingBottom: 8,
      }}>
        <Link to="/" aria-label="Back to menu" style={{ textDecoration: "none" }}>
          <img src="/logo.png" alt="" style={{ width: 64, height: "auto", userSelect: "none" }} />
        </Link>
        {vintage && <p style={{ margin: "10px 0 0", color: "var(--eyebrow)", fontSize: 11, fontWeight: 800, letterSpacing: ".2em" }}>STEP 2 · FRESH FROM THE DARKROOM</p>}
        <h2 style={{ margin: 6, color: "var(--ink)", fontFamily: "var(--display)", fontWeight: 500, fontSize: vintage ? "clamp(1.8rem, 7vw, 2.6rem)" : undefined, letterSpacing: "-.02em" }}>
          {vintage ? <>Your <em style={{ fontWeight: 400 }}>photostrip</em> ✦</> : "Your Photocard"}
        </h2>
      </header>

      {/* contents */}
      <div style={{
        padding: "16px 16px calc(32px + env(safe-area-inset-bottom))",
        display: "grid", placeItems: "center",
      }}>
        <div style={{ display: "grid", gap: 16, placeItems: "center", textAlign: "center", width: "100%" }}>
          <div style={{ width: "100%" }}>
            {vintage && <div className="rs-slot" aria-hidden="true" />}
            <div className={vintage ? "rs-print-clip" : undefined}>
              <canvas
                ref={previewCanvasRef}
                className={vintage ? "rs-print" : undefined}
                style={{
                  display: "block",
                  margin: "0 auto",
                  width: "min(100%, 72vw)",
                  maxWidth: PREVIEW_MAX_W,
                  height: "auto",
                  background: "transparent",
                  boxShadow: vintage ? "0 18px 40px rgba(0,0,0,.45)" : "none",
                  borderRadius: 0,
                }}
              />
            </div>
          </div>

          {vintage && !noPhotos && (
            <p style={{ margin: 0, color: "var(--muted)", fontSize: 14, maxWidth: 320 }}>
              Developed on warm vintage film. Save it and share the love.
            </p>
          )}

          {!noPhotos && (
            <div style={{ display: "grid", gap: 8, width: "min(100%, 320px)" }}>
              <button onClick={download} className="rs-btn" style={{ background: "var(--accent)", color: "var(--accent-ink)", boxShadow: "0 8px 18px var(--accent-shadow)" }}>
                Download PNG
              </button>
              <Link to={`/upload/${tpl.id}`} className="rs-btn" style={{ background: "transparent", color: "var(--ink)", border: "1px solid var(--glass-border)" }}>
                Make another
              </Link>
            </div>
          )}
        </div>
      </div>

      <canvas ref={buildCanvasRef} style={{ display: "none" }} />
    </main>
  );
}

function loadImg(src: string) {
  return new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = src;
  });
}
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
