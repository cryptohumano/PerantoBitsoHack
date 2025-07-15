"use client"
import { Progress } from "@/components/ui/progress";
import { useProgress } from "@/context/progress-context";

export function GlobalProgressBar() {
  const { progress, show } = useProgress();
  if (!show) return null;
  return (
    <div className="fixed top-0 left-0 w-full z-[9999]">
      <Progress value={progress} className="w-full h-1" />
    </div>
  );
} 