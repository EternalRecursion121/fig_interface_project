export function formatPowerOfTen(d) {
  const power = Math.floor(Math.log10(d));
  if (power === 6) return "1M";
  if (power === 7) return "10M";
  if (power === 8) return "100M";
  if (power === 9) return "1B";
  if (power === 10) return "10B";
  if (power === 11) return "100B";
  if (power === 12) return "1T";
  if (power === 13) return "10T";
  if (power === 14) return "100T";
  return `10^${power}`;
}

export function formatWelfareCapacity(value) {
  if (value >= 1e9) {
    return `${(value / 1e9).toFixed(1)}B human-equivalents`;
  } else if (value >= 1e6) {
    return `${(value / 1e6).toFixed(1)}M human-equivalents`;
  }
  return `${value.toFixed(0)} human-equivalents`;
} 