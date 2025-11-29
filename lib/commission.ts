// Commission structure as per system rules
export const COMMISSION_STRUCTURE = {
  0: 165, // Direct (Level 0)
  1: 70,
  2: 70,
  3: 70,
  4: 70,
  5: 70,
  6: 60,
  7: 60,
  8: 60,
  9: 60,
  10: 60,
  11: 50,
  12: 50,
  13: 50,
  14: 50,
  15: 50,
  16: 40,
  17: 30,
  18: 20,
  19: 10,
  20: 5,
} as const;

export const TOTAL_COMMISSION = 1170; // Sum of all commission levels

/**
 * Get commission amount for a specific level
 */
export function getCommissionForLevel(level: number): number {
  if (level < 0 || level > 20) {
    return 0;
  }
  return COMMISSION_STRUCTURE[level as keyof typeof COMMISSION_STRUCTURE] || 0;
}

/**
 * Calculate total commission payout for a purchase
 * This should always equal 1,170
 */
export function calculateTotalCommission(): number {
  return Object.values(COMMISSION_STRUCTURE).reduce((sum, amount) => sum + amount, 0);
}

/**
 * Get commission breakdown for display
 */
export function getCommissionBreakdown() {
  return Object.entries(COMMISSION_STRUCTURE).map(([level, amount]) => ({
    level: parseInt(level),
    amount,
    label: level === '0' ? 'Direct' : `Level ${level}`,
  }));
}

