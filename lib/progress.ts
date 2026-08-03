export type StoredProgress = {
  completedBytes: string[];
  unlockedBytes: string[];
  readinessChoices: Record<string, string>;
  reflections: Record<string, string>;
  projectOutputs: Record<string, Record<string, string>>;
  interactionStates: Record<string, Record<string, unknown>>;
  exerciseAttempts: Record<string, { selected: string; correct: boolean }>;
};

export const INITIAL_UNLOCKED_BYTES = ["L0-CORE-00"];
export const PROGRESS_STORAGE_KEY = "bytesize-ai-progress-v1";

export function createInitialProgress(): StoredProgress {
  return {
    completedBytes: [],
    unlockedBytes: INITIAL_UNLOCKED_BYTES,
    readinessChoices: {},
    reflections: {},
    projectOutputs: {},
    interactionStates: {},
    exerciseAttempts: {}
  };
}

export function normalizeProgress(value: Partial<StoredProgress> | null): StoredProgress {
  const initial = createInitialProgress();
  return {
    completedBytes: Array.from(new Set(value?.completedBytes ?? initial.completedBytes)),
    unlockedBytes: Array.from(new Set([...(value?.unlockedBytes ?? []), ...initial.unlockedBytes])),
    readinessChoices: value?.readinessChoices ?? {},
    reflections: value?.reflections ?? {},
    projectOutputs: value?.projectOutputs ?? {},
    interactionStates: value?.interactionStates ?? {},
    exerciseAttempts: value?.exerciseAttempts ?? {}
  };
}
