/**
 * Normalized exponential volume curve for perceptually linear gain reduction.
 * ~18 dB of gain reduction at 50%.
 */
export function logTaper(x: number): number {
  const a = 10
  const m = 32
  const b = (m * (a - 1)) / (20 * a * Math.log10(a))
  return ((a ** x - 1) / (a - 1)) ** b
}

/**
 * Calculate dB gain needed to match a target LUFS without clipping.
 */
export function loudnessCompensation(
  targetLufs?: number,
  lufs?: number,
  tp?: number,
): number {
  if (targetLufs === undefined || lufs === undefined || tp === undefined) return 0
  const targetLufsInRange = Math.max(-60, Math.min(0, targetLufs))
  const MIN_DB_HEADROOM = 1
  const dbHeadroom = tp > -MIN_DB_HEADROOM ? 0 : Math.abs(tp) - MIN_DB_HEADROOM
  const dbDifference = targetLufsInRange - lufs
  return dbDifference < 0 ? dbDifference : Math.min(dbDifference, dbHeadroom)
}

/** Convert dB to a linear gain ratio (for GainNode) */
export function db2gain(db: number): number {
  return Math.pow(10, db / 20)
}
