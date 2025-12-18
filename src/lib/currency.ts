/**
 * Format a numeric amount as BHD currency using Intl.NumberFormat.
 * Falls back gracefully to a simple string if Intl or the locale fails.
 */
export function formatPrice(amount: number, locale: string = 'en-BH'): string {
  if (Number.isNaN(amount)) return '';

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'BHD',
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    // Fallback if locale is not supported
    const safeAmount = Number.isFinite(amount) ? amount.toFixed(2) : '0.00';
    return `${safeAmount} BHD`;
  }
}



