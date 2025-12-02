export type Slot = { x:number; y:number; w:number; h:number; r?:number }; 
export type Template = {
  id: string;
  name: string;
  frame: string;        
  size: { w: number; h: number };
  slots: Slot[];        
  shots: number;        
  thumb: string;        
};

export const templates: Template[] = [
  {
    id: "photostrip_1",
    name: "BlubWorks Pokemon",
    frame: "/public/photocard_1.png",
    thumb: "/public/photocard_1.png",
    size: { w: 900, h: 2700 },
    shots: 3,

    slots: [
      { x: 8, y: 4,  w: 84, h: 27, r: 20 },
      { x: 8, y: 33.5, w: 84, h: 27, r: 20 },
      { x: 8, y: 63, w: 84, h: 27, r: 20 },
    ],
  },
];
