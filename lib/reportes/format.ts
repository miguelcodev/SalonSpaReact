export function formatMoney(cents: number): string {
  const soles = cents / 100;
  if (soles >= 10000) {
    return `S/ ${(soles / 1000).toFixed(1)}K`;
  }
  return `S/ ${soles.toLocaleString("es-PE", { maximumFractionDigits: 0 })}`;
}
