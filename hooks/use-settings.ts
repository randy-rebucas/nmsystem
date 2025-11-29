import { useState, useEffect } from 'react';

export interface AppSettings {
  siteName: string;
  currency: string;
  minRedemptionPoints: number;
  minWithdraw: number;
  maxWithdraw: number;
  commissionStructure: { [key: number]: number };
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings({
          siteName: data.siteName || 'NMSystem',
          currency: data.currency || 'PHP',
          minRedemptionPoints: data.minRedemptionPoints || 100,
          minWithdraw: data.minWithdraw || 100,
          maxWithdraw: data.maxWithdraw || 50000,
          commissionStructure: data.commissionStructure || {},
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      // Set defaults on error
      setSettings({
        siteName: 'NMSystem',
        currency: 'PHP',
        minRedemptionPoints: 100,
        minWithdraw: 100,
        maxWithdraw: 50000,
        commissionStructure: {},
      });
    } finally {
      setLoading(false);
    }
  };

  return { settings, loading, refetch: fetchSettings };
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

