import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { RefundRequestDialog } from "./RefundRequestDialog";

vi.mock("@iconify/react", () => ({
	Icon: ({ icon }: { icon: string }) => <span aria-hidden="true">{icon}</span>,
}));

vi.mock("@/features/i18n", () => ({
	useTranslation: () => ({
		t: (_key: string, fallback?: string) => fallback ?? _key,
	}),
}));

const payment = {
	payment_id: "payment-1234567890",
	amount: 200000,
};

describe("RefundRequestDialog", () => {
	it("validates the reason and submits the reviewed amount", async () => {
		const user = userEvent.setup();
		const onSubmit = vi.fn().mockResolvedValue(undefined);
		const onOpenChange = vi.fn();

		render(
			<RefundRequestDialog
				open
				payment={payment}
				onOpenChange={onOpenChange}
				onSubmit={onSubmit}
			/>,
		);

		expect(screen.getByLabelText("Refund amount (VND)")).toHaveValue(200000);
		expect(screen.getByText("payment-1234567890")).toBeVisible();

		await user.click(screen.getByRole("button", { name: "Submit request" }));
		expect(screen.getByText("Enter a reason for this refund.")).toBeVisible();
		expect(onSubmit).not.toHaveBeenCalled();

		const amount = screen.getByLabelText("Refund amount (VND)");
		await user.clear(amount);
		await user.type(amount, "150000");
		await user.type(
			screen.getByLabelText("Reason for refund"),
			"Appointment was cancelled before treatment",
		);
		await user.click(screen.getByRole("button", { name: "Submit request" }));

		await waitFor(() =>
			expect(onSubmit).toHaveBeenCalledWith({
				amount: 150000,
				reason: "Appointment was cancelled before treatment",
			}),
		);
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});

	it("closes without mutation and locks actions while submitting", async () => {
		const user = userEvent.setup();
		const onSubmit = vi.fn();
		const onOpenChange = vi.fn();
		const { rerender } = render(
			<RefundRequestDialog
				open
				payment={payment}
				onOpenChange={onOpenChange}
				onSubmit={onSubmit}
			/>,
		);

		await user.click(screen.getByRole("button", { name: "Cancel" }));
		expect(onOpenChange).toHaveBeenCalledWith(false);
		expect(onSubmit).not.toHaveBeenCalled();

		rerender(
			<RefundRequestDialog
				open
				payment={payment}
				onOpenChange={onOpenChange}
				onSubmit={onSubmit}
				isSubmitting
			/>,
		);
		expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
		expect(screen.getByRole("button", { name: "Submitting…" })).toBeDisabled();
	});
});
