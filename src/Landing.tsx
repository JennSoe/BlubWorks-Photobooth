import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <main
      style={{
        position: "relative",
        minHeight: "100dvh",            
        textAlign: "center",
        overflow: "hidden",
      }}
    >
      {/* fixed background */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage: "url('/background.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          zIndex: -1,
          willChange: "transform",     
        }}
      />

      {/* content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100dvh",
          padding: "24px",
        }}
      >
        {/* Logo */}
        <img
          src="/logo.png"
          alt="Photobooth logo"
          style={{
            position: "absolute",       
            top: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "100px",
            height: "auto",
            objectFit: "contain",
            userSelect: "none",
            pointerEvents: "none",
          }}
        />

        <h1 style={{ color: "#111", marginBottom: 16 }}>
          ✨ Welcome to BlubWork’s Photobooth (⁠◍⁠•⁠ᴗ⁠•⁠◍⁠)⁠✧⁠*⁠。📸
        </h1>

        <img
          src="/mainpage_asset.png"
          alt="Photobooth preview"
          style={{ width: "min(550px, 90%)", height: "auto", marginBottom: 30 }}
        />

        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          <Link
            to="/Select"                 
            style={{
              background: "#e17b94",     
              color: "#fff",
              borderRadius: 8,
              padding: "12px 24px",
              fontWeight: 600,
              textDecoration: "none",
              transition: "transform .15s ease, filter .15s ease",
            }}
          >
            Start
          </Link>
        </div>
      </div>
    </main>
  );
}
