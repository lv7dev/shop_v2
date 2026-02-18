const STORAGE_KEY = "recently-viewed";
const MAX_ITEMS = 10;

export function addRecentlyViewed(productSlug: string) {
  if (typeof window === "undefined") return;
  try {
    const items = getRecentlyViewedSlugs();
    const filtered = items.filter((s) => s !== productSlug);
    filtered.unshift(productSlug);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(filtered.slice(0, MAX_ITEMS))
    );
  } catch {
    // localStorage might be unavailable
  }
}

export function getRecentlyViewedSlugs(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
