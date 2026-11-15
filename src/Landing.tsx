import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <main style={pageStyle}>
      <style>{`
        @media (max-width: 760px) {
          .landing-hero { grid-template-columns: 1fr !important; text-align: center; }
          .landing-copy { align-items: center !important; }
          .landing-art { max-width: min(440px, 88vw) !important; }
          .landing-title { font-size: clamp(2.4rem, 11vw, 4rem) !important; }
        }
      `}</style>
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "linear-gradient(135deg, rgba(255,255,255,.46), rgba(255,225,235,.22)), url('/background.png') center/cover no-repeat",
          zIndex: -1,
          pointerEvents: "none",
        }}
      />

      <header style={headerStyle}>
        <img src="/logo.png" alt="BlubWorks logo" style={logoStyle} />
        <span style={headerLabel}>BLUBWORKS · PHOTOBOOTH</span>
      </header>

      <div className="landing-hero" style={heroStyle}>
        <section className="landing-copy" style={copyStyle}>
          <p style={eyebrowStyle}>A LITTLE MOMENT, CAPTURED</p>
          <h1 className="landing-title" style={titleStyle}>
            Make a memory<br />
            <em>worth keeping.</em> <span aria-hidden="true">✦</span>
          </h1>
          <p style={descriptionStyle}>
            Turn your favourite moments into a playful photostrip, made just for you.
          </p>
          <Link to="/Select" style={startButtonStyle}>
            Start the photobooth <span aria-hidden="true">→</span>
          </Link>
          <span style={hintStyle}>Choose a template · Add your photos · Keep the memory</span>
        </section>

        <section style={artPanelStyle} aria-label="Photobooth preview">
          <div style={artGlowStyle} />
          <img
            className="landing-art"
            src="/mainpage_asset.png"
            alt="Playful photobooth photo card preview"
            style={artStyle}
          />
          <span style={stickerStyle}>say cheese! ✦</span>
        </section>
      </div>
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  position: "relative",
  minHeight: "100dvh",
  overflow: "hidden",
  color: "#2b2025",
  fontFamily: "'Avenir Next', Avenir, system-ui, sans-serif",
};

const headerStyle: React.CSSProperties = {
  width: "min(1180px, calc(100% - 48px))",
  margin: "0 auto",
  padding: "22px 0",
  display: "flex",
  alignItems: "center",
  gap: 14,
};

const logoStyle: React.CSSProperties = { width: 58, height: "auto", userSelect: "none" };
const headerLabel: React.CSSProperties = { color: "#8d6874", fontSize: 10, fontWeight: 800, letterSpacing: ".18em" };
const heroStyle: React.CSSProperties = {
  width: "min(1180px, calc(100% - 48px))",
  minHeight: "calc(100dvh - 103px)",
  margin: "0 auto",
  display: "grid",
  gridTemplateColumns: "minmax(0, .9fr) minmax(0, 1.1fr)",
  alignItems: "center",
  gap: "clamp(28px, 7vw, 110px)",
  paddingBottom: 35,
};
const copyStyle: React.CSSProperties = { display: "flex", flexDirection: "column", alignItems: "flex-start", maxWidth: 560 };
const eyebrowStyle: React.CSSProperties = { color: "#b35d78", fontSize: 11, fontWeight: 800, letterSpacing: ".2em", margin: "0 0 15px" };
const titleStyle: React.CSSProperties = { fontFamily: "Georgia, serif", fontSize: "clamp(3.2rem, 6vw, 5.8rem)", lineHeight: .98, letterSpacing: "-.055em", fontWeight: 500, margin: 0 };
const descriptionStyle: React.CSSProperties = { color: "#6d5b62", fontSize: 16, lineHeight: 1.6, maxWidth: 390, margin: "24px 0 28px" };
const startButtonStyle: React.CSSProperties = { background: "#e17b94", color: "#fff", borderRadius: 14, padding: "15px 20px", fontWeight: 800, fontSize: 14, textDecoration: "none", boxShadow: "0 10px 24px rgba(225,123,148,.3)" };
const hintStyle: React.CSSProperties = { color: "#9b878e", fontSize: 11, marginTop: 16 };
const artPanelStyle: React.CSSProperties = { position: "relative", display: "grid", placeItems: "center", minHeight: "min(68vh, 650px)" };
const artGlowStyle: React.CSSProperties = { position: "absolute", width: "75%", aspectRatio: "1", borderRadius: "50%", background: "rgba(255,255,255,.7)", filter: "blur(4px)" };
const artStyle: React.CSSProperties = { position: "relative", width: "min(620px, 100%)", maxHeight: "min(70vh, 650px)", objectFit: "contain", filter: "drop-shadow(0 22px 22px rgba(99,55,72,.16))", transform: "rotate(-2deg)" };
const stickerStyle: React.CSSProperties = { position: "absolute", right: "4%", bottom: "12%", color: "#fff", background: "#b35d78", borderRadius: 99, padding: "10px 15px", fontSize: 12, fontWeight: 800, transform: "rotate(8deg)", boxShadow: "0 8px 18px rgba(99,55,72,.16)" };
