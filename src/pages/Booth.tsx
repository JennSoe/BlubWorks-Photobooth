import { useRef, useState, useEffect, useMemo, type CSSProperties } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { templates } from "../components/template";
import { themeVars, useThemeBody } from "../components/theme";
import { GRAIN_URL, VINTAGE_FILTER_CSS, VINTAGE_OVERLAY_CSS } from "../components/vintage";

type Photo = { id: string; dataURL: string };

const MAX_SHOTS = 4;

export default function Booth() {
  const { templateId } = useParams<{ templateId: string }>();
  const id = templateId ?? "photostrip_1";
  const tpl = useMemo(() => templates.find((t) => t.id === id) ?? templates[0], [id]);
  const keep = tpl.slots.length;
  // Shape of a photo frame on the strip (width / height). The viewfinder and the
  // captured photo both use it, so what you frame is exactly what lands on the strip.
  const shotAspect = useMemo(() => {
    const s = tpl.slots[0];
    return (s.w * tpl.size.w) / (s.h * tpl.size.h);
  }, [tpl]);
  const vintage = tpl.look === "vintage";
  const nav = useNavigate();
  useThemeBody(tpl.theme);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [counting, setCounting] = useState<false | number>(false);
  const [limitReached, setLimitReached] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [flash, setFlash] = useState(0);
  const photosRef = useRef<Photo[]>([]);

  useEffect(() => {
    const video = videoRef.current;
    return () => {
      const media = video?.srcObject as MediaStream | null;
      media?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function startCamera() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 960 }, aspectRatio: { ideal: 4 / 3 } },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStreaming(true);
        setLimitReached(false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not access camera");
    }
  }

  function stopCamera() {
    const media = videoRef.current?.srcObject as MediaStream | null;
    media?.getTracks().forEach((t) => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setStreaming(false);
  }

  function captureOnce() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const vw = video.videoWidth || 1280;
    const vh = video.videoHeight || 960;

    // Centre-crop the camera frame to the strip's landscape frame shape
    // (same crop the viewfinder shows with object-fit: cover).
    let sw = vw, sh = vw / shotAspect;
    if (sh > vh) { sh = vh; sw = vh * shotAspect; }
    const sx = (vw - sw) / 2;
    const sy = (vh - sh) / 2;

    const outW = Math.round(Math.min(sw, 1600));
    const outH = Math.round(outW / shotAspect);
    canvas.width = outW;
    canvas.height = outH;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Mirror like the preview, so the photo matches what you saw (selfie-style).
    ctx.translate(outW, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, outW, outH);

    const dataURL = canvas.toDataURL("image/jpeg", 0.95);
    setFlash((f) => f + 1);

    // Side effects stay outside the state updater (React may run updaters more than once).
    const next = [...photosRef.current, { id: crypto.randomUUID(), dataURL }].slice(0, MAX_SHOTS);
    photosRef.current = next;
    setPhotos(next);
    if (next.length === MAX_SHOTS) {
      stopCamera();
      setLimitReached(true);
    }
  }

  async function countdownAndShoot() {
    if (!streaming || counting || photos.length >= MAX_SHOTS) return;
    for (const n of [3, 2, 1] as const) {
      setCounting(n);
      await new Promise((r) => setTimeout(r, 700));
    }
    setCounting(false);
    captureOnce();
  }

  function clearPhotos() {
    photosRef.current = [];
    setPhotos([]);
    setSelected([]);
    setLimitReached(false);
  }

  function toggleSelect(pid: string) {
    setSelected((prev) => {
      const i = prev.indexOf(pid);
      if (i >= 0) {
        const copy = [...prev];
        copy.splice(i, 1);
        return copy;
      }
      if (prev.length >= keep) return prev;
      return [...prev, pid];
    });
  }

  function handleNext() {
    const chosen = selected.map((sid) => photos.find((p) => p.id === sid)).filter(Boolean) as Photo[];
    nav(`/result/${id}`, { state: { photos: chosen } });
  }

  const ready = selected.length === keep;
  const shutterDisabled = !streaming || !!counting || photos.length >= MAX_SHOTS;

  const copy = vintage
    ? {
        eyebrow: "STEP 1 · STRIKE A POSE",
        title: <>Say <em style={{ fontWeight: 400 }}>cheese</em> ✦</>,
        subtitle: `Take up to ${MAX_SHOTS} shots on warm vintage film, then pick your favourite ${keep} for the strip.`,
        gallery: "Contact sheet",
        galleryEyebrow: "YOUR SHOTS",
        empty: "No exposures yet. Start the camera and strike a pose ✦",
        limit: `That's the whole roll! Pick your best ${keep}.`,
      }
    : {
        eyebrow: "STEP 1 · TAKE YOUR SHOTS",
        title: <>Welcome to the Photobooth!</>,
        subtitle: `Take up to ${MAX_SHOTS} shots, then pick your favourite ${keep} for the strip.`,
        gallery: "Gallery",
        galleryEyebrow: "YOUR SHOTS",
        empty: "No photos yet. Take a shot!",
        limit: `📸 Limit reached! Pick your best ${keep}.`,
      };

  const screen = (
    <div className="booth-screen">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transform: "scaleX(-1)", filter: vintage ? VINTAGE_FILTER_CSS : undefined }}
      />
      {vintage && (
        <>
          <span style={{ position: "absolute", inset: 0, background: VINTAGE_OVERLAY_CSS, pointerEvents: "none" }} />
          <span style={{ position: "absolute", inset: 0, background: GRAIN_URL, mixBlendMode: "overlay", opacity: 0.35, pointerEvents: "none" }} />
          <span className="vt-corners" aria-hidden="true" />
          <span className="vt-counter" aria-live="polite">
            FRAME {Math.min(photos.length + 1, MAX_SHOTS)}/{MAX_SHOTS}
          </span>
        </>
      )}

      {!streaming && (
        <div className="booth-idle">
          <span style={{ fontSize: 30 }} aria-hidden="true">{vintage ? "✦" : "📷"}</span>
          <p style={{ margin: 0 }}>{limitReached ? copy.limit : "Camera is off"}</p>
          {!limitReached && (
            <button onClick={startCamera} className="booth-btn booth-btn-primary">
              Start camera
            </button>
          )}
        </div>
      )}

      {streaming && counting && (
        <div className="booth-count" key={`count-${counting}`}>
          {counting}
        </div>
      )}
      {flash > 0 && <div key={`flash-${flash}`} className="booth-flash" />}
    </div>
  );

  return (
    <main style={{ ...pageStyle, ...themeVars(tpl.theme), ["--shot-ar" as string]: String(shotAspect) }}>
      <style>{`
        .booth-grid { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(300px, .85fr); gap: clamp(20px, 4vw, 48px); align-items: start; }
        .booth-screen { position: relative; width: 100%; aspect-ratio: var(--shot-ar); background: #120609; border-radius: 14px; overflow: hidden; }
        .booth-idle { position: absolute; inset: 0; display: grid; place-content: center; justify-items: center; gap: 10px; text-align: center; padding: 16px; color: #f6ece2; font-size: 14px; }
        .booth-count { position: absolute; inset: 0; display: grid; place-items: center; font: ${vintage ? "italic 400 clamp(80px, 22vw, 140px) var(--display)" : "900 96px var(--body)"};
          color: #fff8ee; text-shadow: 0 6px 24px rgba(0,0,0,.6); background: rgba(20,6,10,.25); animation: booth-pop .7s ease-out both; }
        @keyframes booth-pop { from { transform: scale(1.35); opacity: 0; } 30% { opacity: 1; } to { transform: scale(1); opacity: 1; } }
        .booth-flash { position: absolute; inset: 0; background: #fff8ee; pointer-events: none; animation: booth-flash .6s ease-out forwards; }
        @keyframes booth-flash { from { opacity: 1; } to { opacity: 0; } }

        .booth-controls { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 12px; margin-top: 16px; }
        .booth-btn { box-sizing: border-box; height: 48px; padding: 0 18px; border-radius: 14px; font: 700 14px var(--body); cursor: pointer; touch-action: manipulation; border: 1px solid var(--glass-border); background: transparent; color: var(--ink); white-space: nowrap; }
        .booth-btn:disabled { opacity: .45; cursor: not-allowed; }
        .booth-btn-primary { background: var(--accent); color: var(--accent-ink); border: none; box-shadow: 0 8px 18px var(--accent-shadow); }
        .booth-shutter { width: 76px; height: 76px; border-radius: 50%; cursor: pointer; touch-action: manipulation; position: relative;
          border: 4px solid ${vintage ? "#e6e0d6" : "#fff"}; background: ${vintage ? "radial-gradient(circle at 35% 30%, #f2b3b8, #a3283f 55%, #6d1527)" : "var(--accent)"};
          box-shadow: 0 0 0 2px ${vintage ? "#8f877c" : "rgba(0,0,0,.08)"}, 0 10px 24px rgba(0,0,0,.35); transition: transform .12s ease; }
        .booth-shutter:active:not(:disabled) { transform: scale(.92); }
        .booth-shutter:disabled { filter: grayscale(.6) brightness(.8); opacity: .6; cursor: not-allowed; }

        .vt-camera { border-radius: 26px; overflow: hidden; box-shadow: 0 24px 60px rgba(0,0,0,.45), 0 0 0 1px rgba(232,180,184,.18); }
        .vt-camera-top { height: 54px; display: flex; align-items: center; gap: 12px; padding: 0 18px;
          background: linear-gradient(180deg, #f1ece4 0%, #cfc7bb 48%, #e6e0d6 52%, #bdb5a9 100%); border-bottom: 2px solid #2a0f17; }
        .vt-dial { width: 28px; height: 28px; border-radius: 50%; background: repeating-conic-gradient(#8f877c 0 6deg, #d9d2c6 6deg 12deg); box-shadow: inset 0 0 0 4px #e8e2d8, 0 1px 2px rgba(0,0,0,.35); flex: none; }
        .vt-viewfinder { width: 38px; height: 22px; border-radius: 5px; background: radial-gradient(circle at 35% 35%, #6d5a7a, #1b0b12 70%); box-shadow: inset 0 0 0 3px #2a1a1f; flex: none; }
        .vt-brand { font-family: var(--display); font-style: italic; font-size: 15px; color: #3a1622; flex: 1; text-align: center; white-space: nowrap; }
        .vt-led { width: 10px; height: 10px; border-radius: 50%; background: #6d1527; box-shadow: inset 0 1px 1px rgba(0,0,0,.4); flex: none; }
        .vt-led.on { background: #ff4d6a; box-shadow: 0 0 8px 2px rgba(255,77,106,.7); }
        .vt-camera-body { padding: 14px; background: ${GRAIN_URL}, repeating-linear-gradient(45deg, rgba(0,0,0,.07) 0 2px, transparent 2px 5px), linear-gradient(160deg, #5a2131, #3a1622); }
        .vt-camera-body .booth-screen { border-radius: 10px; box-shadow: inset 0 0 0 3px #1a080d, 0 0 0 1px rgba(217,183,126,.35); }
        .vt-corners { position: absolute; inset: 14px; pointer-events: none;
          background:
            linear-gradient(#f6ece2,#f6ece2) top left/22px 2px, linear-gradient(#f6ece2,#f6ece2) top left/2px 22px,
            linear-gradient(#f6ece2,#f6ece2) top right/22px 2px, linear-gradient(#f6ece2,#f6ece2) top right/2px 22px,
            linear-gradient(#f6ece2,#f6ece2) bottom left/22px 2px, linear-gradient(#f6ece2,#f6ece2) bottom left/2px 22px,
            linear-gradient(#f6ece2,#f6ece2) bottom right/22px 2px, linear-gradient(#f6ece2,#f6ece2) bottom right/2px 22px;
          background-repeat: no-repeat; opacity: .75; }
        .vt-counter { position: absolute; top: 18px; left: 50%; transform: translateX(-50%); font: 700 10px var(--body); letter-spacing: .22em; color: #f6ece2; opacity: .85; text-shadow: 0 1px 3px rgba(0,0,0,.6); }

        .booth-sheet { background: var(--panel); color: var(--panel-ink); border-radius: 24px; padding: clamp(18px, 3vw, 28px); box-shadow: 0 18px 55px rgba(0,0,0,.18); }
        .booth-thumbs { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
        .booth-thumb { position: relative; aspect-ratio: var(--shot-ar); border-radius: 10px; overflow: hidden; padding: 0; cursor: pointer; border: none; background: #1f0d13; touch-action: manipulation;
          box-shadow: 0 0 0 1px var(--row-border); transition: box-shadow .15s ease, transform .15s ease, opacity .15s ease; }
        .booth-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .booth-thumb.is-selected { box-shadow: 0 0 0 3px var(--accent), 0 8px 18px var(--accent-shadow); }
        .booth-thumb.is-dim { opacity: .5; }
        .booth-thumb:focus-visible, .booth-btn:focus-visible, .booth-shutter:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }
        .booth-badge { position: absolute; top: 8px; left: 8px; width: 30px; height: 30px; border-radius: 50%; display: grid; place-items: center;
          background: var(--accent); color: var(--accent-ink); font: 800 14px var(--body); box-shadow: 0 2px 6px rgba(0,0,0,.35); }
        .booth-num { position: absolute; bottom: 6px; right: 8px; font: 700 10px var(--body); letter-spacing: .15em; color: #f6ece2; text-shadow: 0 1px 3px rgba(0,0,0,.7); }

        @media (max-width: 760px) {
          .booth-grid { grid-template-columns: 1fr; gap: 18px; }
          .booth-tip { display: flex !important; }
          .booth-controls { position: fixed; left: 0; right: 0; bottom: 0; z-index: 20; margin: 0;
            padding: 10px 16px calc(10px + env(safe-area-inset-bottom)); background: var(--bar-bg);
            backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border-top: 1px solid var(--glass-border); }
          .booth-shutter { width: 68px; height: 68px; }
          .booth-btn { padding: 0 12px; font-size: 13px; }
          .booth-content { padding-bottom: calc(120px + env(safe-area-inset-bottom)) !important; }
          .booth-intro { margin-bottom: 16px !important; }
        }
        /* Phone held sideways: viewfinder fills the height, controls move to the right edge. */
        @media (orientation: landscape) and (max-height: 520px) {
          .booth-intro, .booth-tip { display: none !important; }
          .booth-header { padding-top: 6px !important; padding-bottom: 2px !important; }
          .booth-header img { width: 36px !important; }
          .booth-content { padding: 4px 0 24px !important; width: calc(100% - 32px - 116px - env(safe-area-inset-right)) !important; margin-left: max(16px, env(safe-area-inset-left)) !important; }
          .booth-grid { grid-template-columns: 1fr; gap: 16px; }
          .booth-cam { width: fit-content; max-width: 100%; margin: 0 auto; }
          .booth-screen { width: auto; height: calc(100dvh - 120px); max-width: 100%; }
          .vt-camera-top { height: 38px; }
          .vt-camera-body { padding: 10px; }
          .booth-controls { position: fixed; top: 0; bottom: 0; right: 0; left: auto; z-index: 20; margin: 0; width: calc(116px + env(safe-area-inset-right));
            grid-template-columns: 1fr; grid-template-rows: 1fr auto 1fr; justify-items: center; gap: 10px;
            padding: 12px calc(10px + env(safe-area-inset-right)) 12px 10px; background: var(--bar-bg);
            backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border-left: 1px solid var(--glass-border); border-top: none; }
          .booth-controls > div { justify-self: center !important; align-self: center; }
          .booth-controls > div:first-child { align-self: start; }
          .booth-controls > div:last-child { align-self: end; }
          .booth-btn { padding: 0 10px; font-size: 12px; height: 42px; }
          .booth-thumbs { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }
        @media (prefers-reduced-motion: reduce) { .booth-flash, .booth-count { animation: none; } }
      `}</style>

      <div style={{ position: "fixed", inset: 0, background: tpl.theme ? "var(--bg)" : "url('/background.png') center/cover no-repeat", zIndex: -1, pointerEvents: "none" }} />

      <header className="booth-header" style={headerStyle}>
        <Link to="/select" aria-label="Back to templates" style={backLinkStyle}>
          <span aria-hidden="true">←</span> Back
        </Link>
        <Link to="/" aria-label="Back to menu">
          <img src="/logo.png" alt="" style={{ width: 52, height: "auto", display: "block", userSelect: "none" }} />
        </Link>
        <div style={stepStyle}>
          <span style={stepActive}>01</span>
          <span style={stepLine} />
          <span style={{ color: "var(--soft)" }}>02</span>
        </div>
      </header>

      <div className="booth-content" style={contentStyle}>
        <section className="booth-intro" style={{ maxWidth: 560, marginBottom: 26 }}>
          <p style={eyebrowStyle}>{copy.eyebrow}</p>
          <h1 style={titleStyle}>{copy.title}</h1>
          <p style={{ color: "var(--muted)", fontSize: 15, lineHeight: 1.6, margin: 0, maxWidth: 440 }}>{copy.subtitle}</p>
          <p className="booth-tip" style={tipStyle}>
            <span aria-hidden="true" style={{ fontSize: 18 }}>↻</span> Turn your phone sideways for a wider landscape selfie.
          </p>
        </section>

        <div className="booth-grid">
          <section aria-label="Camera" style={{ minWidth: 0 }}>
            {vintage ? (
              <div className="vt-camera booth-cam">
                <div className="vt-camera-top" aria-hidden="true">
                  <span className="vt-dial" />
                  <span className="vt-viewfinder" />
                  <span className="vt-brand">BlubWorks 35</span>
                  <span className={`vt-led${streaming ? " on" : ""}`} />
                </div>
                <div className="vt-camera-body">{screen}</div>
              </div>
            ) : (
              <div className="booth-cam" style={{ borderRadius: 14, boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}>{screen}</div>
            )}

            <div className="booth-controls" style={{ ["--bar-bg" as string]: vintage ? "rgba(42,15,23,.9)" : "rgba(255,250,248,.92)" }}>
              <div style={{ justifySelf: "start" }}>
                {streaming ? (
                  <button className="booth-btn" onClick={stopCamera}>Stop</button>
                ) : photos.length > 0 ? (
                  <button className="booth-btn" onClick={startCamera} disabled={limitReached}>
                    Restart
                  </button>
                ) : (
                  // The viewfinder already shows a big "Start camera" button.
                  <span aria-hidden="true" style={{ display: "block", width: 1 }} />
                )}
              </div>
              <button
                className="booth-shutter"
                onClick={countdownAndShoot}
                disabled={shutterDisabled}
                aria-label={`Take photo (${photos.length} of ${MAX_SHOTS} taken)`}
              />
              <div style={{ justifySelf: "end" }}>
                <button className={`booth-btn${ready ? " booth-btn-primary" : ""}`} onClick={handleNext} disabled={!ready}>
                  {ready ? "Develop →" : `${selected.length}/${keep} picked`}
                </button>
              </div>
            </div>

            {error && <p style={{ color: vintage ? "#ffb3c0" : "crimson", marginTop: 12, fontSize: 14 }}>Couldn't open the camera: {error}</p>}
          </section>

          <aside className="booth-sheet" aria-label={copy.gallery}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12, marginBottom: 14 }}>
              <div>
                <p style={{ ...eyebrowStyle, color: vintage ? "#9a4a5c" : "var(--eyebrow)" }}>{copy.galleryEyebrow}</p>
                <h2 style={{ fontFamily: "var(--display)", fontWeight: 500, fontSize: 26, margin: "6px 0 0", letterSpacing: "-.02em" }}>{copy.gallery}</h2>
              </div>
              <button
                onClick={clearPhotos}
                disabled={photos.length === 0}
                className="booth-btn"
                style={{ height: 40, color: "var(--panel-muted)", borderColor: "var(--row-border)" }}
              >
                Clear
              </button>
            </div>

            <p style={{ margin: "0 0 14px", fontSize: 13, color: "var(--panel-muted)" }}>
              {limitReached
                ? copy.limit
                : `Tap your favourite ${keep} in the order you want them on the strip.`}
            </p>

            {photos.length === 0 ? (
              <div style={{ border: "1.5px dashed var(--row-border)", borderRadius: 14, padding: "28px 16px", textAlign: "center", color: "var(--panel-muted)", fontSize: 14 }}>
                {copy.empty}
              </div>
            ) : (
              <div className="booth-thumbs">
                {photos.map((p, n) => {
                  const idx = selected.indexOf(p.id);
                  const isSelected = idx >= 0;
                  const dim = !isSelected && ready;
                  return (
                    <button
                      key={p.id}
                      onClick={() => toggleSelect(p.id)}
                      className={`booth-thumb${isSelected ? " is-selected" : ""}${dim ? " is-dim" : ""}`}
                      aria-pressed={isSelected}
                      aria-label={isSelected ? `Shot ${n + 1}, picked as photo ${idx + 1}` : `Shot ${n + 1}, tap to pick`}
                    >
                      <img src={p.dataURL} alt="" style={{ filter: vintage ? VINTAGE_FILTER_CSS : undefined }} />
                      {isSelected && <span className="booth-badge">{idx + 1}</span>}
                      <span className="booth-num">{String(n + 1).padStart(2, "0")}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </aside>
        </div>
      </div>

      <canvas ref={canvasRef} style={{ display: "none" }} />
    </main>
  );
}

const tipStyle: CSSProperties = { display: "none", alignItems: "center", gap: 8, margin: "12px 0 0", padding: "8px 12px", borderRadius: 12, border: "1px solid var(--glass-border)", color: "var(--ink)", fontSize: 13, width: "fit-content" };
const pageStyle: CSSProperties = { minHeight: "100dvh", color: "var(--ink)", fontFamily: "var(--body)", overflowX: "hidden" };
const headerStyle: CSSProperties = {
  width: "min(1120px, calc(100% - 32px))",
  margin: "0 auto",
  padding: "calc(16px + env(safe-area-inset-top)) 0 8px",
  display: "grid",
  gridTemplateColumns: "1fr auto 1fr",
  alignItems: "center",
};
const backLinkStyle: CSSProperties = { color: "var(--ink)", textDecoration: "none", fontWeight: 700, fontSize: 13, display: "flex", gap: 8, alignItems: "center", minHeight: 44 };
const stepStyle: CSSProperties = { justifySelf: "end", display: "flex", alignItems: "center", gap: 8, fontSize: 11, fontWeight: 800, letterSpacing: ".12em" };
const stepActive: CSSProperties = { background: "var(--accent)", color: "var(--accent-ink)", borderRadius: 99, padding: "7px 9px" };
const stepLine: CSSProperties = { width: 22, height: 1, background: "var(--soft)", opacity: 0.6 };
const contentStyle: CSSProperties = { width: "min(1120px, calc(100% - 32px))", margin: "0 auto", padding: "clamp(20px, 5vw, 56px) 0 calc(40px + env(safe-area-inset-bottom))" };
const eyebrowStyle: CSSProperties = { color: "var(--eyebrow)", fontSize: 11, fontWeight: 800, letterSpacing: ".2em", margin: 0 };
const titleStyle: CSSProperties = { fontFamily: "var(--display)", fontSize: "clamp(2.2rem, 6vw, 4rem)", lineHeight: 1.04, letterSpacing: "-.035em", margin: "12px 0 12px", fontWeight: 500 };
