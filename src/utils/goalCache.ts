const GOAL_CACHE_KEY = "latest_goal_cache";

interface CachedGoal {
  id: string;
  goalWeightKg: number;
  goalSetAt: string;
  reachedAt: string | null;
}

export function saveCurrentGoal(goal: CachedGoal | null) {
  try {
    if (goal) {
      localStorage.setItem(GOAL_CACHE_KEY, JSON.stringify(goal));
    } else {
      localStorage.removeItem(GOAL_CACHE_KEY);
    }
  } catch {
    // silent fail
  }
}

export function getCachedCurrentGoal(): CachedGoal | null {
  try {
    const item = localStorage.getItem(GOAL_CACHE_KEY);
    if (!item) return null;
    const parsed = JSON.parse(item) as CachedGoal;
    // Optional: basic validation / migration
    if (typeof parsed.goalWeightKg !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearCurrentGoalCache() {
  localStorage.removeItem(GOAL_CACHE_KEY);
}
