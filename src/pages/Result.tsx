// src/pages/Result.tsx
import { useEffect, useMemo, useRef } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { templates } from "../components/template";

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

  const buildCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!tpl || !buildCanvasRef.current) return;

    const build = buildCanvasRef.current;
    build.width = tpl.size.w;
    build.height = tpl.size.h;
    const ctx = build.getContext("2d");
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

  return (
    <main style={{ position: "relative", minHeight: "100dvh" }}>
      {/* fixed bg */}
      <div style={{
        position: "fixed", inset: 0,
        background: "url('/background.png') center/cover no-repeat",
        zIndex: -1, pointerEvents: "none",
      }} />

      {/* header */}
      <header style={{
        position: "sticky", top: 0, zIndex: 5,
        display: "grid", placeItems: "center",
        paddingTop: 16, paddingBottom: 8,
      }}>
        <Link to="/" aria-label="Back to menu" style={{ textDecoration: "none" }}>
          <img src="/logo.png" alt="" style={{ width: 72, height: "auto", userSelect: "none" }} />
        </Link>
        <h2 style={{ margin: 6, color: "#111" }}>Your Photocard</h2>
      </header>

      {/* contents */}
      <div style={{
        minHeight: "calc(100dvh - 96px)",
        padding: 24, display: "grid", placeItems: "center",
        fontFamily: "system-ui, sans-serif",
      }}>
        <div style={{ display: "grid", gap: 16, placeItems: "center", textAlign: "center" }}>
          {/* Image preview */}
          <canvas
            ref={previewCanvasRef}
            style={{
              display: "block",
              width: "100%",      
              maxWidth: PREVIEW_MAX_W, 
              height: "auto",     
              background: "transparent",
              boxShadow: "none",
              borderRadius: 0,
            }}
          />

          {!noPhotos && (
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <a
                onClick={() => {
                  const url = buildCanvasRef.current?.toDataURL("image/png");
                  if (!url) return;
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${tpl.name.replace(/\s+/g, "_")}.png`;
                  a.click();
                }}
                style={{
                  background: "#e17b94", color: "#fff",
                  borderRadius: 10, padding: "12px 18px",
                  fontWeight: 800, cursor: "pointer", textDecoration: "none",
                }}
              >
                Download PNG
              </a>
            </div>
          )}
        </div>
      </div>

      <canvas ref={buildCanvasRef} style={{ display: "none" }} />
    </main>
  );
}

// utils
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
