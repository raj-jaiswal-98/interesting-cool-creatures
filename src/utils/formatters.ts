/**
 * Human-friendly metric & telemetry formatters for natural history museum UX.
 * Converts raw scientific floating points (e.g. 0.004 kg, 0.0005 m, -93500000)
 * into intuitive, real-world human readable units.
 */

/**
 * Formats creature weight into intuitive human units:
 * - Microscopic (< 0.1 mg): "< 1 µg"
 * - Small (< 1 kg): "4 g", "250 g"
 * - Medium (< 1,000 kg): "18 kg", "250 kg"
 * - Megafauna (>= 1,000 kg): "7.4 tons", "50 tons"
 */
export function formatCreatureWeight(
  weightKg: number | null | undefined,
  compact = false
): string {
  if (weightKg == null || weightKg <= 0) {
    return compact ? '< 1g' : '< 1 g';
  }

  // Microscopic (< 0.0001 kg = 0.1 g)
  if (weightKg < 0.0001) {
    return compact ? '< 1µg' : '< 1 µg (Microscopic)';
  }

  // Grams range (< 1 kg, e.g. 0.004 kg -> 4 g; 0.25 kg -> 250 g)
  if (weightKg < 1) {
    const grams = Math.round(weightKg * 1000);
    return compact ? `${grams}g` : `${grams} g`;
  }

  // Megafauna (>= 1,000 kg, e.g. 7,400 kg -> 7.4t or 7.4 tons; 50,000 kg -> 50t)
  if (weightKg >= 1000) {
    const tons = weightKg / 1000;
    const formatted = tons % 1 === 0 ? tons.toString() : tons.toFixed(1);
    return compact ? `${formatted}t` : `${formatted} tons`;
  }

  // Standard kilograms (1 kg to 999 kg)
  if (compact) {
    return `${Math.round(weightKg)}kg`;
  }
  return Number.isInteger(weightKg) ? `${weightKg} kg` : `${weightKg.toFixed(1)} kg`;
}

/**
 * Formats creature length into intuitive human units:
 * - Microscopic (< 1 cm): "0.5 mm"
 * - Handheld / Pocket (< 1 m): "3 cm", "25 cm"
 * - Meter scale (>= 1 m): "1.8 m", "14 m"
 */
export function formatCreatureLength(
  lengthMeters: number | null | undefined,
  compact = false
): string {
  if (lengthMeters == null || lengthMeters <= 0) {
    return compact ? 'Var' : 'Variable';
  }

  // Millimeters (< 0.01 m = 1 cm, e.g. 0.0005 m -> 0.5 mm)
  if (lengthMeters < 0.01) {
    const mm = (lengthMeters * 1000).toFixed(1);
    return compact ? `${mm}mm` : `${mm} mm`;
  }

  // Centimeters (< 1 m, e.g. 0.03 m -> 3 cm; 0.25 m -> 25 cm)
  if (lengthMeters < 1) {
    const cm = Math.round(lengthMeters * 100);
    return compact ? `${cm}cm` : `${cm} cm`;
  }

  // Meters scale (>= 1 m, e.g. 1.8 m, 14 m)
  const formatted = Number.isInteger(lengthMeters)
    ? lengthMeters.toString()
    : lengthMeters.toFixed(1);
  return compact ? `${formatted}m` : `${formatted} m`;
}

/**
 * Formats geological extinction timeline year into museum era dates:
 * - null -> "Living species"
 * - Negative millions (e.g. -93500000) -> "93.5M yrs ago"
 * - Negative thousands (e.g. -10000) -> "~10,000 yrs ago"
 * - Positive historical (e.g. 1662) -> "1662 CE"
 */
export function formatExtinctionYear(
  extinctionYear: number | null | undefined,
  compact = false
): string {
  if (extinctionYear === null || extinctionYear === undefined) {
    return compact ? 'Living' : 'Living Species';
  }

  const abs = Math.abs(extinctionYear);
  if (abs >= 1000000) {
    const millions = (abs / 1000000).toFixed(1).replace(/\.0$/, '');
    return compact ? `${millions}M ya` : `${millions}M years ago`;
  }

  if (extinctionYear < 0) {
    return compact ? `${abs.toLocaleString()} ya` : `~${abs.toLocaleString()} years ago`;
  }

  return compact ? `${extinctionYear}` : `${extinctionYear} CE`;
}

/**
 * Translates numerical danger levels (1-10) into contextual museum threat descriptions.
 */
export function formatDangerLevel(level = 5): { label: string; text: string; color: string } {
  if (level >= 9) {
    return { label: 'Apex Predator', text: 'Apex Danger (Colossal Threat)', color: '#FF2E63' };
  }
  if (level >= 7) {
    return { label: 'High Threat', text: 'Venomous / Deadly Strike', color: '#FF5722' };
  }
  if (level >= 5) {
    return { label: 'Defensive', text: 'Moderate Defense (Handle with Care)', color: '#FFB800' };
  }
  if (level >= 3) {
    return { label: 'Mild Threat', text: 'Mild Defense / Low Hazard', color: '#38BDF8' };
  }
  return { label: 'Harmless', text: 'Harmless to Humans', color: '#00FF66' };
}
