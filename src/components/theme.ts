import { useEffect, type CSSProperties } from "react";
import { GRAIN_URL } from "./vintage";

export type ThemeName = "default" | "maroon";

const themes: Record<ThemeName, Record<string, string>> = {
  default: {
    "--bg": "linear-gradient(135deg, rgba(255,255,255,.55), rgba(255,225,235,.25)), url('/background.png') center/cover no-repeat",
    "--ink": "#2b2025",
    "--muted": "#6d5b62",
    "--soft": "#8d7a81",
    "--accent": "#e17b94",
    "--accent-2": "#c86682",
    "--accent-ink": "#fff",
    "--accent-shadow": "rgba(225,123,148,.25)",
    "--eyebrow": "#b35d78",
    "--glass": "rgba(255,255,255,.42)",
    "--glass-border": "rgba(255,255,255,.72)",
    "--panel": "#fffaf8",
    "--panel-ink": "#2b2025",
    "--panel-muted": "#9b878e",
    "--row": "#fff",
    "--row-border": "#f1e7e8",
    "--chip": "#f6edef",
    "--track": "#f0e2e5",
    "--display": "Georgia, serif",
    "--body": "'Avenir Next', Avenir, system-ui, sans-serif",
  },
  maroon: {
    "--bg": `${GRAIN_URL}, radial-gradient(120% 80% at 10% 0%, #7a2e42 0%, transparent 55%), radial-gradient(90% 70% at 100% 100%, #62233a 0%, transparent 60%), #3a1622`,
    "--ink": "#f6ece2",
    "--muted": "#dcc3c3",
    "--soft": "#c9a9ad",
    "--accent": "#d9b77e",
    "--accent-2": "#b8904f",
    "--accent-ink": "#3a1622",
    "--accent-shadow": "rgba(217,183,126,.28)",
    "--eyebrow": "#e8b4b8",
    "--glass": "rgba(255,236,226,.06)",
    "--glass-border": "rgba(232,180,184,.22)",
    "--panel": "#f6ece2",
    "--panel-ink": "#3a1622",
    "--panel-muted": "#8a6a70",
    "--row": "#fffaf4",
    "--row-border": "#ecdccd",
    "--chip": "#f3e3d6",
    "--track": "#ecdccd",
    "--display": "'Fraunces', Georgia, serif",
    "--body": "'DM Sans', system-ui, sans-serif",
  },
};

export function themeVars(name: ThemeName = "default"): CSSProperties {
  return themes[name] as CSSProperties;
}

const pageColor: Record<ThemeName, string> = { default: "", maroon: "#3a1622" };

/** Paints <body> in the theme colour so iOS overscroll / long pages never flash white. */
export function useThemeBody(name: ThemeName = "default") {
  useEffect(() => {
    const prev = document.body.style.backgroundColor;
    document.body.style.backgroundColor = pageColor[name];
    return () => {
      document.body.style.backgroundColor = prev;
    };
  }, [name]);
}
