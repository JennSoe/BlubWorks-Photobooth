import { createContext, useCallback, useContext, useState } from "react";

export type Shot = { id: string; dataURL: string };

type BoothState = {
  templateId?: string;
  shots: (Shot | null)[];
  setTemplateId(id: string): void;
  setShots(
    next: ((xs: (Shot | null)[]) => (Shot | null)[]) | (Shot | null)[]
  ): void;
  clear(): void;
  reset(count?: number): void;
};

const Ctx = createContext<BoothState>(null as any);

export function BoothProvider({ children }: { children: React.ReactNode }) {
  const [templateId, setTemplateId] = useState<string>();
  const [shots, _setShots] = useState<(Shot | null)[]>([]);

  // stable function identities
  const setShots = useCallback((
    next: ((xs: (Shot | null)[]) => (Shot | null)[]) | (Shot | null)[]
  ) => {
    _setShots(prev => (typeof next === "function" ? (next as any)(prev) : next));
  }, []);

  const clear = useCallback(() => {
    _setShots([]);
  }, []);

  const reset = useCallback((count?: number) => {
    _setShots(typeof count === "number" ? Array(count).fill(null) : []);
  }, []);

  return (
    <Ctx.Provider value={{ templateId, shots, setTemplateId, setShots, clear, reset }}>
      {children}
    </Ctx.Provider>
  );
}

export const useBooth = () => useContext(Ctx);
