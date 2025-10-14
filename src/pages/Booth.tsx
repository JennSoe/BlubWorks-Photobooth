import { useRef, useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";

type Photo = { id: string; dataURL: string };

const RIGHT_COL_W = 440;   // gallery column width
const THUMB_MAX   = 360;   // max width for square thumbs
const CAM_MAX_W   = 640;   // max camera box width
const CAM_FIXED_H = 560;   

export default function Booth() {
  const { templateId } = useParams<{ templateId: string }>();
  const id = templateId ?? "photostrip_1";
  const nav = useNavigate();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [counting, setCounting] = useState<false | number>(false);
  const [limitReached, setLimitReached] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  // Stop camera tracks when leaving the page
  useEffect(() => {
    return () => {
      const media = videoRef.current?.srcObject as MediaStream | null;
      media?.getTracks().forEach(t => t.stop());
    };
  }, []);

  async function startCamera() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 960 } },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStreaming(true);
        setLimitReached(false);
      }
    } catch (e: any) {
      setError(e?.message ?? "Could not access camera");
    }
  }

  function stopCamera() {
    const media = videoRef.current?.srcObject as MediaStream | null;
    media?.getTracks().forEach(t => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setStreaming(false);
  }

  function captureOnce() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const w = video.videoWidth || 720;
    const h = video.videoHeight || 960;
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);

    const dataURL = canvas.toDataURL("image/jpeg", 0.85);

    setPhotos(prev => {
      const next = [...prev, { id: crypto.randomUUID(), dataURL }].slice(0, 4);
      if (next.length === 4) {
        stopCamera();
        setLimitReached(true);
      }
      return next;
    });
  }

  async function countdownAndShoot() {
    if (!streaming || photos.length >= 4) return;
    for (const n of [3, 2, 1] as const) {
      setCounting(n);
      await new Promise(r => setTimeout(r, 700));
    }
    setCounting(false);
    captureOnce();
  }

  function clearPhotos() {
    setPhotos([]);
    setSelected([]);
    setLimitReached(false);
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const i = prev.indexOf(id);
      if (i >= 0) {
        const copy = [...prev];
        copy.splice(i, 1);
        return copy;
      }
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  }

  function handleNext() {
    const chosen = photos.filter(p => selected.includes(p.id));
    nav(`/result/${id}`, { state: { photos: chosen } });
  }

  return (
    <div style={{ position: "relative", minHeight: "100dvh" }}>
      {/* background */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "url('/background.png') center/cover no-repeat",
          zIndex: -1,
          pointerEvents: "none",
        }}
      />

      {/* header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 5,
          display: "grid",
          placeItems: "center",
          paddingTop: 16,
          paddingBottom: 8,
        }}
      >
        <Link to="/" aria-label="Back to menu" style={{ textDecoration: "none" }}>
          <img src="/logo.png" alt="" style={{ width: 72, height: "auto", userSelect: "none" }} />
        </Link>
        <h2 style={{ margin: 6, color: "#111" }}>Welcome to the Photobooth!</h2>
      </header>

      {/* content */}
      <div
        style={{
          fontFamily: "system-ui, sans-serif",
          minHeight: "calc(100dvh - 96px)",
          padding: 24,
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
        }}
      >
        <div style={{ width: "100%", maxWidth: 1000, marginInline: "auto" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `minmax(360px, 1fr) ${RIGHT_COL_W}px`,
              gap: 16,
              alignItems: "start",
            }}
          >
            {/* camera column */}
            <section
              style={{
                display: "grid",
                placeItems: "center",
                padding: 8,
                minWidth: 0, // allow column to shrink
              }}
            >
              <div style={{ position: "relative", width: "100%", maxWidth: CAM_MAX_W }}>
                <div
                  style={{
                    width: "100%",
                    height: CAM_FIXED_H, 
                    background: "#000",
                    borderRadius: 12,
                    overflow: "hidden",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                  }}
                >
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>

                {counting && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "grid",
                      placeItems: "center",
                      fontSize: 96,
                      fontWeight: 900,
                      color: "white",
                      textShadow: "0 6px 16px rgba(0,0,0,.7)",
                      background: "rgba(0,0,0,.2)",
                      borderRadius: 12,
                    }}
                  >
                    {counting}
                  </div>
                )}
              </div>

              {/* controls */}
              <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                {!streaming ? (
                  <button onClick={startCamera}>Start camera</button>
                ) : (
                  <button onClick={stopCamera}>Stop camera</button>
                )}
                <button onClick={countdownAndShoot} disabled={!streaming || photos.length >= 4}>
                  Take Photo
                </button>
                <button onClick={clearPhotos} disabled={photos.length === 0}>
                  Clear
                </button>
              </div>

              {error && <p style={{ color: "crimson", marginTop: 8 }}>Error: {error}</p>}
              {limitReached && (
                <p style={{ marginTop: 16, fontWeight: 700, color: "#e17b94", textAlign: "center" }}>
                  📸 Limit reached! Pick your best 3.
                </p>
              )}
            </section>

            {/* gallery column (only this scrolls) */}
            <aside
              style={{
                background: "#fff",
                border: "1px solid #eee",
                borderRadius: 12,
                padding: 12,
                boxShadow: "0 4px 14px rgba(0,0,0,.06)",
                minHeight: 160,
                display: "flex",
                flexDirection: "column",
                minWidth: 0, // allow column to shrink
              }}
            >
              <h3 style={{ margin: "4px 0 10px 0" }}>Gallery (tap to select up to 3)</h3>

              <div
                style={{
                  flex: 1,
                  overflowY: "auto",   // only the gallery pane scrolls
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  paddingRight: 6,
                  maxHeight: 560,
                  overscrollBehavior: "contain",
                  WebkitOverflowScrolling: "touch" as any,
                }}
              >
                {photos.length === 0 && (
                  <div style={{ color: "#777" }}>No photos yet — take a shot!</div>
                )}

                {photos.map((p) => {
                  const idx = selected.indexOf(p.id);
                  const isSelected = idx >= 0;
                  return (
                    <div
                      key={p.id}
                      onClick={() => toggleSelect(p.id)}
                      style={{
                        position: "relative",
                        width: "100%",
                        aspectRatio: "1 / 1",
                        maxWidth: THUMB_MAX,
                        marginInline: "auto",
                        borderRadius: 12,
                        overflow: "hidden",
                        border: isSelected ? "2px solid #e17b94" : "1px solid #ddd",
                        cursor: "pointer",
                        flexShrink: 0,
                      }}
                      title={isSelected ? `Selected #${idx + 1}` : "Tap to select"}
                    >
                      <img
                        src={p.dataURL}
                        alt="shot"
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      />
                      {isSelected && (
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            background: "rgba(225,123,148,0.5)",
                            display: "grid",
                            placeItems: "center",
                            color: "#fff",
                            fontSize: 48,
                            fontWeight: 900,
                            textShadow: "0 3px 8px rgba(0,0,0,.35)",
                          }}
                        >
                          {idx + 1}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <p style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
                Tap again to unselect. You can only keep 3.
              </p>

              {selected.length === 3 && (
                <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
                  <button
                    onClick={handleNext}
                    style={{
                      background: "#e17b94",
                      color: "#fff",
                      borderRadius: 12,
                      padding: "12px 18px",
                      fontWeight: 800,
                      cursor: "pointer",
                      border: "none",
                    }}
                  >
                    Next →
                  </button>
                </div>
              )}
            </aside>
          </div>
        </div>

        {/* offscreen canvas */}
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>
    </div>
  );
}
