// STRICT formula: (Cost + Shipping + Fixed) / (1 - Margin%)
export function calcTargetPrice(cost: number, shipping: number, fixed: number, marginPct: number): number {
  if (marginPct >= 100) throw new Error("Margin cannot be >= 100%");
  return (cost + shipping + fixed) / (1 - (marginPct / 100));
}
