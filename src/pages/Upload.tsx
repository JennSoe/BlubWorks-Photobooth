import { Link, useParams, useNavigate } from "react-router-dom";
import { templates, type Slot } from "../components/template";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useBooth, type Shot } from "../store";
import { themeVars, useThemeBody } from "../components/theme";
import { GRAIN_URL, VINTAGE_FILTER_CSS, VINTAGE_OVERLAY_CSS } from "../components/vintage";

export default function Upload() {
  const { templateId } = useParams();
  const tpl = useMemo(() => templates.find((t) => t.id === templateId), [templateId]);
  const { shots, setShots, reset } = useBooth();
  const nav = useNavigate();
  const [flash, setFlash] = useState(0);
  useThemeBody(tpl?.theme);

  useEffect(() => {
    if (!tpl) return;
    reset(tpl.slots.length);
  }, [reset, tpl]);

  if (!tpl) {
    return (
      <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: 16 }}>
        <p>Template not found.</p>
      </main>
    );
  }

  const vintage = tpl.look === "vintage";

  async function onPick(i: number, file: File, inputEl: HTMLInputElement) {
    const url = await fileToDataURL(file);
    setShots((prev) => {
      const next = [...prev];
      next[i] = { id: crypto.randomUUID(), dataURL: url } as Shot;
      return next;
    });
    if (vintage) setFlash((f) => f + 1);
    inputEl.value = "";
  }

  const readyCount = shots.filter(Boolean).length;
  const isComplete = readyCount === tpl.slots.length;

  const copy = vintage
    ? {
        eyebrow: "STEP 1 · LOAD THE FILM",
        subtitle: "Choose a photo for each frame and we'll give it a warm, vintage film finish. Tap a frame again to swap it.",
        panelEyebrow: "YOUR ROLL",
        panelTitle: "Load the film",
        cta: "Develop my photostrip",
      }
    : {
        eyebrow: "STEP 1 · BUILD YOUR STRIP",
        subtitle: "Choose a photo for each frame. You can tap any frame again to replace it.",
        panelEyebrow: "YOUR PHOTOS",
        panelTitle: "Fill the frames",
        cta: "Create my photostrip",
      };

  const create = () => nav(`/result/${tpl.id}`, { state: { photos: shots.filter(Boolean) as Shot[] } });

  const panelContent = (
    <>
      <div>
        <p style={{ ...eyebrowStyle, ...(vintage ? { color: "#9a4a5c" } : {}) }}>{copy.panelEyebrow}</p>
        <h2 style={panelTitleStyle}>{copy.panelTitle}</h2>
      </div>

      {vintage ? (
        <div className="vt-film" aria-label={`${readyCount} of ${tpl.slots.length} frames exposed`}>
          <div className="vt-film-frames">
            {tpl.slots.map((_, i) => {
              const url = (shots[i] as Shot | null)?.dataURL;
              return (
                <div key={`film-${i}`} className="vt-film-frame">
                  {url ? (
                    <img src={url} alt="" style={{ filter: VINTAGE_FILTER_CSS }} />
                  ) : (
                    <span>{String(i + 1).padStart(2, "0")}</span>
                  )}
                </div>
              );
            })}
          </div>
          <p className="vt-film-label">
            {readyCount} / {tpl.slots.length} EXPOSED
          </p>
        </div>
      ) : (
        <div style={progressTrackStyle} aria-label={`${readyCount} of ${tpl.slots.length} photos added`}>
          <div style={{ ...progressFillStyle, width: `${(readyCount / tpl.slots.length) * 100}%` }} />
        </div>
      )}

      <div style={listStyle}>
        {tpl.slots.map((_, i) => {
          const has = !!(shots[i] as Shot | null)?.dataURL;
          return (
            <div key={`status-${i}`} style={photoRowStyle}>
              <span style={{ ...numberStyle, ...(has ? numberReadyStyle : {}) }}>{has ? "✓" : `0${i + 1}`}</span>
              <div style={{ flex: 1 }}>
                <strong style={rowTitleStyle}>{vintage ? `Frame ${i + 1}` : `Photo ${i + 1}`}</strong>
                <span style={rowDetailStyle}>
                  {has ? (vintage ? "Exposed & ready" : "Ready to go") : "Waiting for a photo"}
                </span>
              </div>
              <span style={{ color: has ? "var(--accent-2)" : "var(--panel-muted)", fontSize: 18 }}>{has ? "✦" : "＋"}</span>
            </div>
          );
        })}
      </div>

      <div className="upload-actions" style={actionsStyle}>
        <button
          onClick={create}
          disabled={!isComplete}
          className={vintage ? "cta-main vt-shutter" : "cta-main"}
          style={{ ...btnPrimary, opacity: isComplete ? 1 : 0.5, cursor: isComplete ? "pointer" : "not-allowed" }}
        >
          {copy.cta} <span aria-hidden="true">→</span>
        </button>
        <button onClick={() => reset(tpl.slots.length)} style={btnLight}>
          Start over
        </button>
      </div>
    </>
  );

  return (
    <main style={{ ...pageStyle, ...themeVars(tpl.theme) }}>
      <style>{`
        .upload-workspace { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(300px, .9fr); gap: clamp(24px, 6vw, 88px); align-items: center; }
        @media (max-width: 760px) {
          .upload-workspace { grid-template-columns: 1fr; gap: 20px; }
          .upload-content { padding-top: 20px !important; }
          .upload-intro { margin-bottom: 18px !important; }
          .upload-actions .cta-main { display: none; }
          .upload-actions { margin-top: 14px !important; }
          .mobile-bar { display: flex !important; }
          .upload-content { padding-bottom: calc(110px + env(safe-area-inset-bottom)) !important; }
        }
        .mobile-bar {
          display: none; position: fixed; left: 0; right: 0; bottom: 0; z-index: 20; gap: 12px; align-items: center;
          padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
          background: var(--bar-bg); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
          border-top: 1px solid var(--glass-border); box-shadow: 0 -10px 30px rgba(0,0,0,.12);
        }

        .vt-flash { position: absolute; inset: 0; z-index: 5; background: #fff8ee; pointer-events: none; animation: vt-flash .55s ease-out forwards; border-radius: 6px; }
        @keyframes vt-flash { from { opacity: .95; } to { opacity: 0; } }

        .vt-camera { border-radius: 26px; overflow: hidden; box-shadow: 0 24px 60px rgba(0,0,0,.45), 0 0 0 1px rgba(232,180,184,.18); }
        .vt-camera-top {
          position: relative; height: 58px; display: flex; align-items: center; gap: 12px; padding: 0 18px;
          background: linear-gradient(180deg, #f1ece4 0%, #cfc7bb 48%, #e6e0d6 52%, #bdb5a9 100%);
          border-bottom: 2px solid #2a0f17;
        }
        .vt-dial { width: 30px; height: 30px; border-radius: 50%; background: repeating-conic-gradient(#8f877c 0 6deg, #d9d2c6 6deg 12deg); box-shadow: inset 0 0 0 4px #e8e2d8, 0 1px 2px rgba(0,0,0,.35); flex: none; }
        .vt-brand { font-family: var(--display); font-style: italic; font-size: 15px; color: #3a1622; letter-spacing: .02em; flex: 1; text-align: center; white-space: nowrap; }
        .vt-viewfinder { width: 40px; height: 24px; border-radius: 5px; background: radial-gradient(circle at 35% 35%, #6d5a7a, #1b0b12 70%); box-shadow: inset 0 0 0 3px #2a1a1f, 0 1px 0 rgba(255,255,255,.6); flex: none; }
        .vt-shutter-dot { width: 22px; height: 22px; border-radius: 50%; background: radial-gradient(circle at 35% 30%, #f2b3b8, #a3283f 60%, #6d1527); box-shadow: 0 2px 3px rgba(0,0,0,.4); flex: none; }
        .vt-camera-body {
          padding: 16px;
          background: ${GRAIN_URL}, repeating-linear-gradient(45deg, rgba(0,0,0,.07) 0 2px, transparent 2px 5px), linear-gradient(160deg, #5a2131, #3a1622);
        }
        .vt-plate {
          background: var(--panel); color: var(--panel-ink); border-radius: 16px;
          padding: clamp(18px, 4vw, 30px); box-shadow: inset 0 0 0 1px rgba(184,144,79,.45), inset 0 0 0 5px var(--panel), inset 0 0 0 6px rgba(184,144,79,.35);
        }

        .vt-film { background: #1f0d13; border-radius: 6px; padding: 14px 8px 8px; margin-bottom: 16px; position: relative;
          background-image: radial-gradient(circle, #f6ece2 0 2px, transparent 2.5px); background-size: 14px 10px; background-repeat: repeat-x; background-position: 4px 2px; }
        .vt-film-frames { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
        .vt-film-frame { aspect-ratio: 4 / 3; border-radius: 3px; background: #3b1f27; overflow: hidden; display: grid; place-items: center; }
        .vt-film-frame img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .vt-film-frame span { color: #d9b77e; font: 600 11px var(--body); letter-spacing: .15em; opacity: .7; }
        .vt-film-label { margin: 8px 2px 0; color: #d9b77e; font: 700 10px var(--body); letter-spacing: .22em; }

        .vt-shutter { background: linear-gradient(180deg, #e6c891, #c9a263) !important; box-shadow: 0 8px 18px rgba(58,22,34,.25), inset 0 1px 0 rgba(255,255,255,.5) !important; }
        .slot-picker:focus-within { outline: 3px solid var(--accent); outline-offset: 2px; }

        @media (prefers-reduced-motion: reduce) { .vt-flash { display: none; } }
      `}</style>
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "var(--bg)",
          zIndex: -2,
          pointerEvents: "none",
        }}
      />

      <header style={headerStyle}>
        <Link to="/" aria-label="Back to menu" style={backLinkStyle}>
          <span aria-hidden="true">←</span> Menu
        </Link>
        <Link to="/" aria-label="Back to menu">
          <img src="/logo.png" alt="" style={logoStyle} />
        </Link>
        <div style={stepStyle}>
          <span style={stepActive}>01</span>
          <span style={stepLine} />
          <span style={stepMuted}>02</span>
        </div>
      </header>

      <div className="upload-content" style={contentStyle}>
        <section className="upload-intro" style={introStyle}>
          <p style={eyebrowStyle}>{copy.eyebrow}</p>
          <h1 style={titleStyle}>
            Bring your memories<br />
            {vintage ? <em style={{ fontWeight: 400 }}>to life</em> : "to life"} <span aria-hidden="true">✦</span>
          </h1>
          <p style={subtitleStyle}>{copy.subtitle}</p>
        </section>

        <div className="upload-workspace">
          <section style={previewPanelStyle} aria-label="Photostrip preview">
            <div style={previewTopline}>
              <span>LIVE PREVIEW</span>
              <span style={previewCountStyle}>{readyCount} / {tpl.slots.length} ADDED</span>
            </div>
            <div style={{ width: "min(370px, 72vw)", minWidth: 220, position: "relative", isolation: "isolate" }}>
              {/* Photo slots stay beneath the template frame so the artwork is preserved. */}
              {tpl.slots.map((s: Slot, i: number) => {
                const url = (shots[i] as Shot | null)?.dataURL;
                return (
                  <div
                    key={`preview-${i}`}
                    style={{
                      position: "absolute",
                      left: `${s.x}%`,
                      top: `${s.y}%`,
                      width: `${s.w}%`,
                      height: `${s.h}%`,
                      overflow: "hidden",
                      borderRadius: s.r ? `${s.r}px` : "12px",
                      zIndex: 1,
                      background: url ? "transparent" : vintage ? "rgba(246,236,226,.92)" : "rgba(255,255,255,.15)",
                      display: "grid",
                      placeItems: "center",
                      boxShadow: url ? "none" : "inset 0 0 0 1px rgba(255,255,255,.4)",
                    }}
                  >
                    {url ? (
                      <>
                        <img
                          src={url}
                          alt={`slot ${i + 1}`}
                          style={{ width: "100%", height: "100%", objectFit: "cover", filter: vintage ? VINTAGE_FILTER_CSS : undefined }}
                        />
                        {vintage && (
                          <>
                            <span style={{ position: "absolute", inset: 0, background: VINTAGE_OVERLAY_CSS }} />
                            <span style={{ position: "absolute", inset: 0, background: GRAIN_URL, mixBlendMode: "overlay", opacity: 0.35 }} />
                          </>
                        )}
                      </>
                    ) : (
                      <span style={{ color: vintage ? "#6d3445" : "rgba(40,28,34,.68)", fontWeight: 700, fontSize: 12, textAlign: "center", padding: 8 }}>
                        <span style={plusStyle}>+</span><br />ADD PHOTO
                      </span>
                    )}
                  </div>
                );
              })}

              {/* upload overlays */}
              {tpl.slots.map((s: Slot, i: number) => {
                const has = !!(shots[i] as Shot | null)?.dataURL;
                return (
                  <label
                    key={`picker-${i}`}
                    className="slot-picker"
                    style={{
                      position: "absolute",
                      left: `${s.x}%`,
                      top: `${s.y}%`,
                      width: `${s.w}%`,
                      height: `${s.h}%`,
                      zIndex: 3,
                      border: has ? "2px solid transparent" : vintage ? "2px dashed rgba(122,46,66,.45)" : "2px dashed #bbb",
                      borderRadius: s.r ? `${s.r}px` : "12px",
                      cursor: "pointer",
                      background: "transparent",
                      WebkitTapHighlightColor: "transparent",
                    }}
                    title={has ? `Replace photo ${i + 1}` : `Upload photo ${i + 1}`}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      aria-label={has ? `Replace photo ${i + 1}` : `Upload photo ${i + 1}`}
                      style={visuallyHidden}
                      onChange={(e) => {
                        const file = e.currentTarget.files?.[0];
                        if (file) onPick(i, file, e.currentTarget);
                      }}
                    />
                  </label>
                );
              })}

              {/* frame on top */}
              <img
                src={tpl.frame}
                alt=""
                style={{
                  width: "100%",
                  display: "block",
                  position: "relative",
                  zIndex: 2,
                  pointerEvents: "none",
                }}
              />
              {vintage && flash > 0 && <div key={`flash-${flash}`} className="vt-flash" />}
            </div>
            <p style={previewHintStyle}>Tap a frame to upload a photo</p>
          </section>

          {vintage ? (
            <section className="vt-camera" aria-label="Your photos">
              <div className="vt-camera-top" aria-hidden="true">
                <span className="vt-dial" />
                <span className="vt-viewfinder" />
                <span className="vt-brand">BlubWorks 35</span>
                <span className="vt-shutter-dot" />
              </div>
              <div className="vt-camera-body">
                <div className="vt-plate">{panelContent}</div>
              </div>
            </section>
          ) : (
            <section style={controlsPanelStyle}>{panelContent}</section>
          )}
        </div>
      </div>

      {/* Phones: keep the main action in reach while scrolling the tall strip. */}
      <div className="mobile-bar" style={{ ["--bar-bg" as string]: vintage ? "rgba(42,15,23,.88)" : "rgba(255,250,248,.9)" }}>
        <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: ".12em", color: "var(--eyebrow)", whiteSpace: "nowrap" }}>
          {readyCount}/{tpl.slots.length}
        </span>
        <button
          onClick={create}
          disabled={!isComplete}
          className={vintage ? "vt-shutter" : undefined}
          style={{ ...btnPrimary, flex: 1, opacity: isComplete ? 1 : 0.5, cursor: isComplete ? "pointer" : "not-allowed" }}
        >
          {isComplete ? copy.cta : `Add ${tpl.slots.length - readyCount} more photo${tpl.slots.length - readyCount === 1 ? "" : "s"}`}
        </button>
      </div>
    </main>
  );
}

const pageStyle: CSSProperties = {
  minHeight: "100dvh",
  color: "var(--ink)",
  fontFamily: "var(--body)",
  overflowX: "hidden",
};

const headerStyle: CSSProperties = {
  width: "min(1120px, calc(100% - 32px))",
  margin: "0 auto",
  padding: "calc(16px + env(safe-area-inset-top)) 0 8px",
  display: "grid",
  gridTemplateColumns: "1fr auto 1fr",
  alignItems: "center",
};

const backLinkStyle: CSSProperties = {
  color: "var(--ink)",
  textDecoration: "none",
  fontWeight: 700,
  fontSize: 13,
  display: "flex",
  gap: 8,
  alignItems: "center",
  minHeight: 44,
};

const logoStyle: CSSProperties = { width: 52, height: "auto", userSelect: "none", display: "block" };
const stepStyle: CSSProperties = { justifySelf: "end", display: "flex", alignItems: "center", gap: 8, fontSize: 11, fontWeight: 800, letterSpacing: ".12em" };
const stepActive: CSSProperties = { background: "var(--accent)", color: "var(--accent-ink)", borderRadius: 99, padding: "7px 9px" };
const stepMuted: CSSProperties = { color: "var(--soft)" };
const stepLine: CSSProperties = { width: 22, height: 1, background: "var(--soft)", opacity: 0.6 };

const contentStyle: CSSProperties = { width: "min(1120px, calc(100% - 32px))", margin: "0 auto", padding: "clamp(28px, 6vw, 72px) 0 calc(40px + env(safe-area-inset-bottom))" };
const introStyle: CSSProperties = { maxWidth: 560, marginBottom: 30 };
const eyebrowStyle: CSSProperties = { color: "var(--eyebrow)", fontSize: 11, fontWeight: 800, letterSpacing: ".2em", margin: 0 };
const titleStyle: CSSProperties = { fontFamily: "var(--display)", fontSize: "clamp(2.2rem, 6vw, 4.5rem)", lineHeight: 1.04, letterSpacing: "-.035em", margin: "12px 0 14px", fontWeight: 500 };
const subtitleStyle: CSSProperties = { maxWidth: 440, color: "var(--muted)", fontSize: 15, lineHeight: 1.6, margin: 0 };

const previewPanelStyle: CSSProperties = { background: "var(--glass)", border: "1px solid var(--glass-border)", borderRadius: 28, padding: "18px 16px 16px", boxShadow: "0 18px 55px rgba(111,67,81,.12)", display: "grid", justifyItems: "center", minWidth: 0 };
const previewTopline: CSSProperties = { width: "100%", display: "flex", justifyContent: "space-between", color: "var(--soft)", fontSize: 10, fontWeight: 800, letterSpacing: ".18em", marginBottom: 14 };
const previewCountStyle: CSSProperties = { color: "var(--eyebrow)" };
const plusStyle: CSSProperties = { display: "inline-grid", placeItems: "center", width: 25, height: 25, border: "1px solid currentColor", borderRadius: "50%", fontSize: 18, lineHeight: 1, opacity: 0.7 };
const previewHintStyle: CSSProperties = { color: "var(--soft)", fontSize: 12, margin: "14px 0 0" };
const controlsPanelStyle: CSSProperties = { background: "var(--panel)", color: "var(--panel-ink)", borderRadius: 28, padding: "clamp(20px, 4vw, 42px)", boxShadow: "0 18px 55px rgba(111,67,81,.13)", border: "1px solid rgba(255,255,255,.9)" };
const panelTitleStyle: CSSProperties = { fontFamily: "var(--display)", fontWeight: 500, fontSize: 30, margin: "8px 0 20px", letterSpacing: "-.03em" };
const progressTrackStyle: CSSProperties = { height: 6, borderRadius: 10, background: "var(--track)", overflow: "hidden", marginBottom: 18 };
const progressFillStyle: CSSProperties = { height: "100%", background: "linear-gradient(90deg, var(--accent), var(--accent-2))", borderRadius: 10, transition: "width .25s ease" };
const listStyle: CSSProperties = { display: "grid", gap: 8 };
const photoRowStyle: CSSProperties = { display: "flex", alignItems: "center", gap: 12, padding: "11px 12px", borderRadius: 15, background: "var(--row)", border: "1px solid var(--row-border)" };
const numberStyle: CSSProperties = { display: "grid", placeItems: "center", width: 32, height: 32, borderRadius: "50%", background: "var(--chip)", color: "var(--accent-2)", fontSize: 11, fontWeight: 800, flex: "none" };
const numberReadyStyle: CSSProperties = { background: "var(--accent)", color: "var(--accent-ink)" };
const rowTitleStyle: CSSProperties = { display: "block", fontSize: 14 };
const rowDetailStyle: CSSProperties = { display: "block", color: "var(--panel-muted)", fontSize: 12, marginTop: 2 };
const actionsStyle: CSSProperties = { display: "grid", gap: 6, marginTop: 24 };

const btnPrimary: CSSProperties = {
  background: "var(--accent)",
  color: "var(--accent-ink)",
  border: "none",
  borderRadius: 14,
  padding: "15px 18px",
  minHeight: 50,
  fontWeight: 700,
  cursor: "pointer",
  fontSize: 15,
  fontFamily: "inherit",
  boxShadow: "0 8px 18px var(--accent-shadow)",
  touchAction: "manipulation",
};

const btnLight: CSSProperties = {
  background: "transparent",
  color: "var(--panel-muted)",
  border: "none",
  padding: "8px 16px",
  minHeight: 44,
  fontWeight: 700,
  cursor: "pointer",
  fontSize: 13,
  fontFamily: "inherit",
  touchAction: "manipulation",
};

const visuallyHidden: CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  opacity: 0,
  overflow: "hidden",
  pointerEvents: "none",
};

function fileToDataURL(file: File) {
  return new Promise<string>((res) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.readAsDataURL(file);
  });
}
