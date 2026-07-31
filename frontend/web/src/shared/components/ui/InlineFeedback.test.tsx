import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ErrorMessage } from "./ErrorMessage";
import { InlineFeedback } from "./InlineFeedback";

vi.mock("@iconify/react", () => ({
	Icon: ({ icon }: { icon: string }) => <span aria-hidden="true">{icon}</span>,
}));

describe("InlineFeedback", () => {
	it("exposes semantic error feedback and an accessible action", async () => {
		const onAction = vi.fn();
		render(
			<InlineFeedback
				tone="error"
				title="Clinical context unavailable"
				actionLabel="Try again"
				onAction={onAction}
			>
				Treatment decisions should wait until the context reloads.
			</InlineFeedback>,
		);

		const alert = screen.getByRole("alert");
		expect(alert).toHaveTextContent("Clinical context unavailable");
		expect(alert).toHaveClass("bg-destructive/10", "text-destructive");
		await userEvent.click(screen.getByRole("button", { name: "Try again" }));
		expect(onAction).toHaveBeenCalledOnce();
	});

	it("keeps shared API errors on the semantic theme-safe surface", () => {
		const { container } = render(
			<ErrorMessage message="Unable to load record" />,
		);

		expect(within(container).getByRole("alert")).toHaveClass(
			"bg-destructive/10",
			"text-destructive",
		);
	});
});
