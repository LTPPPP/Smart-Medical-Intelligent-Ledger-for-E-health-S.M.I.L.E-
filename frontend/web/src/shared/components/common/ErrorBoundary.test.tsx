import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ErrorBoundary } from "./ErrorBoundary";

vi.mock("@iconify/react", () => ({
	Icon: () => <span aria-hidden="true" />,
}));

describe("ErrorBoundary", () => {
	it("does not render raw exception details", () => {
		render(
			<ErrorBoundary
				error={
					Object.assign(new Error("SQL password=secret internal stack"), {
						digest: "safe-digest",
					})
				}
				reset={vi.fn()}
			/>,
		);

		expect(screen.queryByText(/password=secret/i)).not.toBeInTheDocument();
		expect(
			screen.getByText("An unexpected error occurred. Please try again."),
		).toBeInTheDocument();
		expect(screen.getByText(/Reference: safe-digest/i)).toBeInTheDocument();
	});
});
