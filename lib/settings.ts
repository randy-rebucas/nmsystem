import connectDB from './mongodb';
import Settings from '@/models/Settings';

export interface AppSettings {
  siteName: string;
  currency: string;
  minRedemptionPoints: number;
  minWithdraw: number;
  maxWithdraw: number;
  commissionStructure: { [key: number]: number };
}

/**
 * Get settings from database (server-side only)
 */
export async function getSettings(): Promise<AppSettings> {
  await connectDB();
  
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({});
  }
  
  // Convert commissionStructure Map to object
  const commissionStructure: { [key: number]: number } = {};
  if (settings.commissionStructure) {
    const commissionMap = settings.commissionStructure as any;
    if (commissionMap instanceof Map) {
      commissionMap.forEach((value: number, key: string) => {
        commissionStructure[parseInt(key)] = value;
      });
    } else {
      Object.entries(commissionMap).forEach(([key, value]) => {
        commissionStructure[parseInt(key)] = value as number;
      });
    }
  }
  
  return {
    siteName: settings.siteName || 'NMSystem',
    currency: settings.currency || 'PHP',
    minRedemptionPoints: settings.minRedemptionPoints || 100,
    minWithdraw: settings.minWithdraw || 100,
    maxWithdraw: settings.maxWithdraw || 50000,
    commissionStructure,
  };
}

/**
 * Get currency symbol based on currency code
 */
export function getCurrencySymbol(currency: string): string {
  const symbols: { [key: string]: string } = {
    PHP: '₱',
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
  };
  return symbols[currency.toUpperCase()] || currency;
}

/**
 * Format currency amount with symbol
 */
export function formatCurrency(amount: number, currency: string = 'PHP'): string {
  const symbol = getCurrencySymbol(currency);
  return `${symbol}${amount.toLocaleString()}`;
}

