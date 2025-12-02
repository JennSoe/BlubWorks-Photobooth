import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { templates } from "../components/template";

export default function Select() {
  const [i, setI] = useState(0);
  const t = templates[i];
  const nav = useNavigate();

  return (
    <main style={{ position: "relative", minHeight: "100dvh", overflow: "hidden" }}>
      {/* fixed background */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "url('/background.png') center/cover no-repeat",
          zIndex: -1,
          willChange: "transform",
        }}
      />

      {/* clickable logo → home */}
      <button
        onClick={() => nav("/")}
        aria-label="Back to landing"
        style={{
          position: "absolute",
          top: 16,
          left: "50%",
          transform: "translateX(-50%)",
          width: 70,
          height: 70,
          padding: 0,
          border: "none",
          background: "transparent",
          cursor: "pointer",
        }}
      >
        <img
          src="/logo.png"
          alt=""
          style={{ width: "100%", height: "auto", pointerEvents: "none", userSelect: "none" }}
        />
      </button>

      {/* content */}
      <div
        style={{
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          padding: 24,
          textAlign: "center",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "grid", gap: 12, alignItems: "center", justifyItems: "center", maxWidth: 520, width: "100%" }}>
          {/* carousel row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, width: "100%" }}>
            <ArrowButton
              label="Previous template"
              onClick={() => setI((i - 1 + templates.length) % templates.length)}
            >
              ⟨
            </ArrowButton>

            {/* preview box (keeps strip fully visible) */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "min(78vh, 560px)", // adjust to taste
                flex: "1 1 0",
              }}
            >
              <img
                src={t.thumb || t.frame}
                alt={t.name}
                style={{
                  height: "90%",           // shrink/grow entire strip
                  width: "auto",
                  objectFit: "contain",
                  display: "block",
                  border: "none",
                  boxShadow: "none",
                  background: "transparent",
                }}
              />
            </div>

            <ArrowButton
              label="Next template"
              onClick={() => setI((i + 1) % templates.length)}
            >
              ⟩
            </ArrowButton>
          </div>

          {/* title & details */}
          <h2 style={{ margin: "8px 0 0" }}>{t.name}</h2>
          <p style={{ margin: 0, opacity: 0.75 }}>
            {t.shots} photos • export {t.size.w}×{t.size.h}px
          </p>

          {/* actions */}
          <div
            style={{
              display: "flex",
              gap: 16,
              marginTop: 16,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button onClick={() => nav(`/booth/${t.id}`)} style={btnPrimary}>
              Use Camera
            </button>
            <button onClick={() => nav(`/upload/${t.id}`)} style={btnLight}>
              Upload
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

/* ---------------- helpers area ---------------- */

const btnPrimary: React.CSSProperties = {
  background: "#e17b94",
  color: "#fff",
  border: "none",
  borderRadius: 16,
  padding: "14px 28px",
  fontSize: "1rem",
  fontWeight: 700,
  cursor: "pointer",
  touchAction: "manipulation",
  transition: "transform .15s ease, filter .15s ease",
};

const btnLight: React.CSSProperties = {
  background: "#fff",
  color: "#111",
  border: "1px solid #ddd",
  borderRadius: 16,
  padding: "14px 28px",
  fontSize: "1rem",
  fontWeight: 700,
  cursor: "pointer",
  touchAction: "manipulation",
  transition: "transform .15s ease, filter .15s ease",
};

const arrowBase: React.CSSProperties = {
  background: "rgba(255,255,255,0.85)",
  border: "1px solid #ddd",
  borderRadius: "50%",
  width: 48,
  height: 48,
  fontSize: "1.5rem",
  fontWeight: 600,
  color: "#333",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "box-shadow .2s ease, transform .15s ease",
};

/** Round arrow with pink glow on hover/focus, small press scale on active */
function ArrowButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      style={arrowBase}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 0 12px 3px rgba(225, 123, 148, 0.6)")}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
      onFocus={(e) => (e.currentTarget.style.boxShadow = "0 0 12px 3px rgba(225, 123, 148, 0.8)")}
      onBlur={(e) => (e.currentTarget.style.boxShadow = "none")}
      onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.96)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
      onTouchStart={(e) => (e.currentTarget.style.transform = "scale(0.96)")}
      onTouchEnd={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      {children}
    </button>
  );
}
