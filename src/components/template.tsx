import type { ThemeName } from "./theme";

export type Slot = { x:number; y:number; w:number; h:number; r?:number };
export type Template = {
  id: string;
  name: string;
  frame: string;
  size: { w: number; h: number };
  slots: Slot[];
  shots: number;
  thumb: string;
  theme?: ThemeName;    // page colours + fonts
  look?: "vintage";     // photo finish applied in preview + export
};

export const templates: Template[] = [
  {
    id: "birthday_selina",
    name: "Happy Birthday Selina",
    frame: "/photocard_birthday.png",
    thumb: "/photocard_birthday.png",
    size: { w: 1000, h: 2700 },
    shots: 3,
    theme: "maroon",
    look: "vintage",

    // Photo openings measured from the 1000x2700 artwork (with ~2px bleed under the white border).
    slots: [
      { x: 10.9, y: 10.778, w: 78.2, h: 22.815, r: 2 },
      { x: 10.9, y: 37.407, w: 78.2, h: 22.778, r: 2 },
      { x: 10.9, y: 64.0,   w: 78.2, h: 22.815, r: 2 },
    ],
  },
  {
    id: "photostrip_1",
    name: "BlubWorks Pokemon",
    frame: "/photocard_1.png",
    thumb: "/photocard_1.png",
    size: { w: 900, h: 2700 },
    shots: 3,

    slots: [
      { x: 8, y: 4,  w: 84, h: 27, r: 20 },
      { x: 8, y: 33.5, w: 84, h: 27, r: 20 },
      { x: 8, y: 63, w: 84, h: 27, r: 20 },
    ],
  },
];
