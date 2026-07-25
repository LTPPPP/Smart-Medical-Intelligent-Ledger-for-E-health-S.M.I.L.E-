// ============================================================
// Currency formatting utilities — Vietnamese Dong (VND)
// ============================================================

const VND_FORMATTER = new Intl.NumberFormat("vi-VN", {
	style: "currency",
	currency: "VND",
	maximumFractionDigits: 0,
});

const USD_FORMATTER = new Intl.NumberFormat("en-US", {
	style: "currency",
	currency: "USD",
	minimumFractionDigits: 2,
});

/**
 * Format a number as Vietnamese Dong.
 * @example formatVND(1500000) → "1.500.000 ₫"
 */
export function formatVND(amount: number): string {
	return VND_FORMATTER.format(amount);
}

/**
 * Format a number as US Dollar.
 * @example formatUSD(99.99) → "$99.99"
 */
export function formatUSD(amount: number): string {
	return USD_FORMATTER.format(amount);
}

/**
 * Format currency based on currency code.
 */
export function formatCurrency(
	amount: number,
	currency: "VND" | "USD" = "VND",
): string {
	return currency === "VND" ? formatVND(amount) : formatUSD(amount);
}
