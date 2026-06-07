export function formatCurrency(
    amount: number,
    currency: string = 'IDR',
    locale: string = 'id-ID'
): string {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount)
}