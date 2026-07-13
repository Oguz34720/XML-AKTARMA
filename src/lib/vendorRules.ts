export function normalizeVendor(marka: string): string {
  if (!marka) return "";
  if (marka.trim().toLowerCase() === "öz-iş") return "VW Classic Club";
  return marka.trim();
}
