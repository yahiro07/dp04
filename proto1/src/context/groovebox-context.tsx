import { createContext, type ReactNode, useContext, useEffect } from "react";

import {
  type GrooveboxController,
  useGrooveboxController,
} from "../hooks/use-groovebox-controller";
import { playbackEngine } from "../playback-engine";

const GrooveboxContext = createContext<GrooveboxController | null>(null);

interface GrooveboxProviderProps {
  children: ReactNode;
}

export function GrooveboxProvider({ children }: GrooveboxProviderProps) {
  const controller = useGrooveboxController();

  useEffect(() => {
    playbackEngine.init();
  }, []);

  return (
    <GrooveboxContext.Provider value={controller}>
      {children}
    </GrooveboxContext.Provider>
  );
}

export function useGroovebox() {
  const value = useContext(GrooveboxContext);
  if (!value) {
    throw new Error("useGroovebox must be used within GrooveboxProvider");
  }
  return value;
}
