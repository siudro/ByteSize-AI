"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  createInitialProgress,
  normalizeProgress,
  PROGRESS_STORAGE_KEY,
  type StoredProgress
} from "@/lib/progress";

type ProgressContextValue = {
  progress: StoredProgress;
  loaded: boolean;
  completeByte: (byteId: string, unlocks?: string[]) => void;
  saveReadinessChoice: (byteId: string, choiceId: string) => void;
  saveReflection: (key: string, value: string) => void;
  saveProjectOutput: (key: string, value: Record<string, string>) => void;
  saveInteractionState: (key: string, value: Record<string, unknown>) => void;
  saveExerciseAttempt: (key: string, selected: string, correct: boolean) => void;
  resetProgress: () => void;
  isUnlocked: (byteId: string) => boolean;
  isCompleted: (byteId: string) => boolean;
};

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  const [progress, setProgress] = useState<StoredProgress>(createInitialProgress);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PROGRESS_STORAGE_KEY);
      setProgress(normalizeProgress(raw ? (JSON.parse(raw) as Partial<StoredProgress>) : null));
    } catch {
      setProgress(createInitialProgress());
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (loaded) {
      window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
    }
  }, [loaded, progress]);

  const value = useMemo<ProgressContextValue>(() => {
    const isUnlocked = (byteId: string) => progress.unlockedBytes.includes(byteId);
    const isCompleted = (byteId: string) => progress.completedBytes.includes(byteId);

    return {
      progress,
      loaded,
      isUnlocked,
      isCompleted,
      completeByte(byteId, unlocks = []) {
        setProgress((current) =>
          normalizeProgress({
            ...current,
            completedBytes: [...current.completedBytes, byteId],
            unlockedBytes: [...current.unlockedBytes, ...unlocks]
          })
        );
      },
      saveReadinessChoice(byteId, choiceId) {
        setProgress((current) =>
          normalizeProgress({
            ...current,
            readinessChoices: {
              ...current.readinessChoices,
              [byteId]: choiceId
            }
          })
        );
      },
      saveReflection(key, value) {
        setProgress((current) =>
          normalizeProgress({
            ...current,
            reflections: {
              ...current.reflections,
              [key]: value
            }
          })
        );
      },
      saveProjectOutput(key, value) {
        setProgress((current) =>
          normalizeProgress({
            ...current,
            projectOutputs: {
              ...current.projectOutputs,
              [key]: value
            }
          })
        );
      },
      saveInteractionState(key, value) {
        setProgress((current) =>
          normalizeProgress({
            ...current,
            interactionStates: {
              ...current.interactionStates,
              [key]: value
            }
          })
        );
      },
      saveExerciseAttempt(key, selected, correct) {
        setProgress((current) =>
          normalizeProgress({
            ...current,
            exerciseAttempts: {
              ...current.exerciseAttempts,
              [key]: { selected, correct }
            }
          })
        );
      },
      resetProgress() {
        setProgress(createInitialProgress());
      }
    };
  }, [loaded, progress]);

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error("useProgress must be used within ProgressProvider");
  }
  return context;
}
