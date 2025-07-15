"use client"
import React, { createContext, useContext, useState } from "react";

interface ProgressContextType {
  progress: number;
  setProgress: (value: number) => void;
  show: boolean;
  setShow: (value: boolean) => void;
}

const ProgressContext = createContext<ProgressContextType>({
  progress: 0,
  setProgress: () => {},
  show: false,
  setShow: () => {},
});

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState(0);
  const [show, setShow] = useState(false);

  return (
    <ProgressContext.Provider value={{ progress, setProgress, show, setShow }}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  return useContext(ProgressContext);
} 