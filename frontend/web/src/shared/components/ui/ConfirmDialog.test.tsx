import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ConfirmDialog } from "./ConfirmDialog";

describe("ConfirmDialog", () => {
	it("describes the destructive action and supports the safe cancel path", async () => {
		const onOpenChange = vi.fn();

		render(
			<ConfirmDialog
				open
				title="Delete service?"
				description="This action cannot be undone."
				onOpenChange={onOpenChange}
				onConfirm={vi.fn()}
			/>,
		);

		expect(
			screen.getByRole("dialog", { name: "Delete service?" }),
		).toHaveAccessibleDescription("This action cannot be undone.");

		await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});

	it("confirms once and disables dismissal while pending", async () => {
		const onConfirm = vi.fn();
		const { rerender } = render(
			<ConfirmDialog
				open
				title="Delete image?"
				description="The image will be permanently removed."
				confirmLabel="Delete image"
				onOpenChange={vi.fn()}
				onConfirm={onConfirm}
			/>,
		);

		await userEvent.click(screen.getByRole("button", { name: "Delete image" }));
		expect(onConfirm).toHaveBeenCalledTimes(1);

		rerender(
			<ConfirmDialog
				open
				pending
				title="Delete image?"
				description="The image will be permanently removed."
				confirmLabel="Delete image"
				onOpenChange={vi.fn()}
				onConfirm={onConfirm}
			/>,
		);

		expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
		expect(screen.getByRole("button", { name: "Deleting…" })).toBeDisabled();
	});
});
