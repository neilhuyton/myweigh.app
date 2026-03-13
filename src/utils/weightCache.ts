interface CachedLatestWeight {
  weightKg: number;
  createdAt: string;
  timestamp: number;
}

const STORAGE_KEY = 'latest_weight_cache';

export function saveLatestWeight(entry: { weightKg: number; createdAt: string }): void {
  const cache: CachedLatestWeight = {
    weightKg: entry.weightKg,
    createdAt: entry.createdAt,
    timestamp: Date.now(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
}

export function getCachedLatestWeight(): CachedLatestWeight | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as CachedLatestWeight;
    return parsed;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function clearLatestWeightCache(): void {
  localStorage.removeItem(STORAGE_KEY);
}