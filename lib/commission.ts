import { getSettings } from './settings';

// Default commission structure (fallback)
const DEFAULT_COMMISSION_STRUCTURE = {
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

/**
 * Get commission amount for a specific level
 * Uses settings from database, falls back to default if not available
 */
export async function getCommissionForLevel(level: number): Promise<number> {
  if (level < 0 || level > 20) {
    return 0;
  }
  
  try {
    const settings = await getSettings();
    return settings.commissionStructure[level] || 0;
  } catch (error) {
    // Fallback to default if settings can't be loaded
    return DEFAULT_COMMISSION_STRUCTURE[level as keyof typeof DEFAULT_COMMISSION_STRUCTURE] || 0;
  }
}

/**
 * Get commission structure (for synchronous use where settings are already loaded)
 */
export function getCommissionForLevelSync(level: number, commissionStructure: { [key: number]: number }): number {
  if (level < 0 || level > 20) {
    return 0;
  }
  return commissionStructure[level] || DEFAULT_COMMISSION_STRUCTURE[level as keyof typeof DEFAULT_COMMISSION_STRUCTURE] || 0;
}

/**
 * Calculate total commission payout for a purchase
 */
export async function calculateTotalCommission(): Promise<number> {
  try {
    const settings = await getSettings();
    return Object.values(settings.commissionStructure).reduce((sum, amount) => sum + amount, 0);
  } catch (error) {
    // Fallback to default
    return Object.values(DEFAULT_COMMISSION_STRUCTURE).reduce((sum, amount) => sum + amount, 0);
  }
}

/**
 * Get commission breakdown for display
 */
export async function getCommissionBreakdown() {
  try {
    const settings = await getSettings();
    return Object.entries(settings.commissionStructure).map(([level, amount]) => ({
      level: parseInt(level),
      amount,
      type: level === '0' ? 'direct' : 'indirect',
      label: level === '0' ? 'Direct' : `Level ${level}`,
    }));
  } catch (error) {
    // Fallback to default
    return Object.entries(DEFAULT_COMMISSION_STRUCTURE).map(([level, amount]) => ({
      level: parseInt(level),
      amount,
      type: level === '0' ? 'direct' : 'indirect',
      label: level === '0' ? 'Direct' : `Level ${level}`,
    }));
  }
}

/**
 * Validate commission structure
 * Ensures all levels 0-20 are present and amounts are valid
 */
export async function validateCommissionStructure(): Promise<{
  valid: boolean;
  errors: string[];
  warnings: string[];
}> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const settings = await getSettings();
    const structure = settings.commissionStructure;

    // Check that all levels 0-20 are present
    for (let level = 0; level <= 20; level++) {
      if (!(level in structure) || structure[level] === undefined) {
        warnings.push(`Level ${level} is missing from commission structure`);
      } else if (structure[level] < 0) {
        errors.push(`Level ${level} has negative commission amount: ${structure[level]}`);
      }
    }

    // Check that level 0 (direct) is set
    if (!structure[0] || structure[0] === 0) {
      warnings.push('Direct commission (Level 0) is not set or is zero');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  } catch (error: any) {
    errors.push(`Failed to validate commission structure: ${error.message}`);
    return {
      valid: false,
      errors,
      warnings,
    };
  }
}

