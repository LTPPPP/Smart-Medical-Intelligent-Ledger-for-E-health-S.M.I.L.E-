// Currency Formatting

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

// Format VND
export function formatVND(amount: number): string {
	return VND_FORMATTER.format(amount);
}

// Format USD
export function formatUSD(amount: number): string {
	return USD_FORMATTER.format(amount);
}

// Format Currency
export function formatCurrency(
	amount: number,
	currency: "VND" | "USD" = "VND",
): string {
	return currency === "VND" ? formatVND(amount) : formatUSD(amount);
}
