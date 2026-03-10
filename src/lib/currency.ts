/**
 * Centralized currency symbol mapping.
 * Use `getCurrencySymbol()` everywhere you need to display a currency symbol.
 */

const CURRENCY_SYMBOLS: Record<string, string> = {
    RUB: '₽',
    EUR: '€',
    USD: '$',
    BYN: 'BYN',
};

/**
 * Returns the display symbol for a given currency code.
 * Falls back to the raw currency code if no symbol is mapped.
 *
 * @example
 * getCurrencySymbol('EUR') // '€'
 * getCurrencySymbol('RUB') // '₽'
 * getCurrencySymbol('XYZ') // 'XYZ'
 */
export function getCurrencySymbol(currency: string): string {
    return CURRENCY_SYMBOLS[currency] ?? currency;
}

/**
 * Formats a numeric amount with its currency symbol.
 *
 * @example
 * formatPrice(129.5, 'EUR') // '€129.50'
 * formatPrice(4200, 'RUB')  // '₽4200.00'
 */
export function formatPrice(amount: number, currency: string): string {
    return `${amount.toFixed(2)} ${getCurrencySymbol(currency)}`;
}

export { CURRENCY_SYMBOLS };
