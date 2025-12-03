import { Link, useParams, useNavigate } from "react-router-dom";
import { templates } from "../components/template";
import { useEffect, useMemo } from "react";
import { useBooth, type Shot } from "../store";

export default function Upload() {
  const { templateId } = useParams();
  const tpl = useMemo(() => templates.find((t) => t.id === templateId), [templateId]);
  const { shots, setShots, reset } = useBooth();
  const nav = useNavigate();

  useEffect(() => {
    if (!tpl) return;
    reset(tpl.slots.length); 
  }, [tpl?.id]);

  if (!tpl) {
    return (
      <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: 16 }}>
        <p>Template not found.</p>
      </main>
    );
  }

  async function onPick(i: number, file: File, inputEl: HTMLInputElement) {
    const url = await fileToDataURL(file);
    setShots((prev) => {
      const next = [...prev];
      next[i] = { id: crypto.randomUUID(), dataURL: url } as Shot;
      return next;
    });

    inputEl.value = "";
  }

  const readyCount = shots.filter(Boolean).length;

  return (
    <main style={{ minHeight: "100dvh", display: "grid", placeItems: "start center" }}>
      {/* fixed background */}
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
          width: "100%",
          backdropFilter: "blur(2px)",
        }}
      >
        <Link to="/" aria-label="Back to menu" style={{ textDecoration: "none" }}>
          <img src="/logo.png" alt="" style={{ width: 72, height: "auto", userSelect: "none" }} />
        </Link>
        <h2 style={{ margin: 6, color: "#111" }}>Upload your photos ✨</h2>
      </header>

      {/* content */}
      <div style={{ display: "grid", placeItems: "center", width: "100%", padding: 16 }}>
        <div style={{ width: "min(420px,92vw)", position: "relative", isolation: "isolate" }}>
          {/* previews */}
          {tpl.slots.map((s: any, i: number) => {
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
                  background: url ? "transparent" : "rgba(255,255,255,.15)",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                {url ? (
                  <img
                    src={url}
                    alt={`slot ${i + 1}`}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <span style={{ color: "#666", fontWeight: 600, fontSize: 14 }}>
                    Tap to insert uploaded photo
                  </span>
                )}
              </div>
            );
          })}

          {/* upload overlays */}
          {tpl.slots.map((s: any, i: number) => {
            const has = !!(shots[i] as Shot | null)?.dataURL;
            return (
              <label
                key={`picker-${i}`}
                style={{
                  position: "absolute",
                  left: `${s.x}%`,
                  top: `${s.y}%`,
                  width: `${s.w}%`,
                  height: `${s.h}%`,
                  zIndex: 3,
                  border: has ? "2px solid transparent" : "2px dashed #bbb",
                  borderRadius: s.r ? `${s.r}px` : "12px",
                  cursor: "pointer",
                  background: "transparent",
                }}
                title={has ? "Replace photo" : "Upload photo"}
              >
                <input
                  type="file"
                  accept="image/*"
                  hidden
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
        </div>

        {/* buttons */}
        <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
          <button
            onClick={() =>
              nav(`/result/${tpl.id}`, {
                state: { photos: shots.filter(Boolean) as Shot[] },
              })
            }
            disabled={readyCount === 0}
            style={{ ...btnPrimary, opacity: readyCount === 0 ? 0.6 : 1 }}
          >
            Make Strip
          </button>

          <button onClick={() => reset(tpl.slots.length)} style={btnLight}>
            Reset
          </button>
        </div>
      </div>
    </main>
  );
}

const btnPrimary: React.CSSProperties = {
  background: "#e17b94",
  color: "#fff",
  border: "none",
  borderRadius: 10,
  padding: "10px 16px",
  fontWeight: 700,
  cursor: "pointer",
};

const btnLight: React.CSSProperties = {
  background: "#fff",
  color: "#111",
  border: "1px solid #ddd",
  borderRadius: 10,
  padding: "10px 16px",
  fontWeight: 700,
  cursor: "pointer",
};

function fileToDataURL(file: File) {
  return new Promise<string>((res) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.readAsDataURL(file);
  });
}
