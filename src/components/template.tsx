// src/templates.ts
export type Slot = { x:number; y:number; w:number; h:number; r?:number }; // % of canvas
export type Template = {
  id: string;
  name: string;
  frame: string;        // PNG with transparent holes
  size: { w: number; h: number }; // export size in px (e.g. 900x2700)
  slots: Slot[];        // where each photo goes (as percentages)
  shots: number;        // 2 or 3 etc
  thumb: string;        // small preview image
};

export const templates: Template[] = [
  {
    id: "photostrip_1",
    name: "BlubWorks Pokemon",
    frame: "/public/photocard_1.png",
    thumb: "/public/photocard_1.png",
    size: { w: 900, h: 2700 },
    shots: 3,
    // each rect is % (0–100) relative to export canvas
    slots: [
      { x: 8, y: 4,  w: 84, h: 27, r: 20 },
      { x: 8, y: 33.5, w: 84, h: 27, r: 20 },
      { x: 8, y: 63, w: 84, h: 27, r: 20 },
    ],
  },
];
