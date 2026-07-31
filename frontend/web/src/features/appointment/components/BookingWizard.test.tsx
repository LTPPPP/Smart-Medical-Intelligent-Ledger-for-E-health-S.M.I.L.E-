import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
	buildExactDoctorScheduleParams,
	DoctorSlotPicker,
} from "./BookingWizard";

vi.mock("@iconify/react", () => ({
	Icon: ({ icon }: { icon: string }) => <span aria-hidden="true">{icon}</span>,
}));

vi.mock("@/features/i18n", () => ({
	useTranslation: () => ({
		t: (_key: string, fallback?: string) => fallback ?? _key,
	}),
}));

const dates = [
	{
		date: "2026-08-01",
		doctors: [
			{
				doctor_id: "doctor-1",
				slots: [
					{
						option_token: "slot-token-0900",
						start_time: "09:00",
						occupied_until: "09:30",
						status: "available" as const,
					},
					{
						start_time: "09:30",
						occupied_until: "10:00",
						status: "booked" as const,
					},
				],
			},
		],
	},
	{
		date: "2026-08-02",
		doctors: [
			{
				doctor_id: "doctor-1",
				slots: [
					{
						start_time: "10:00",
						occupied_until: "10:30",
						status: "booked" as const,
					},
				],
			},
		],
	},
];

describe("DoctorSlotPicker", () => {
	it("labels server-backed date and time availability and selects only bookable slots", async () => {
		const onSelectSlot = vi.fn();
		const onActiveDateChange = vi.fn();

		render(
			<DoctorSlotPicker
				dates={dates}
				activeDate="2026-08-01"
				onActiveDateChange={onActiveDateChange}
				onSelectSlot={onSelectSlot}
				selectedDate=""
				selectedTime=""
			/>,
		);

		const availableDate = screen.getByRole("button", {
			name: /sat 01\/08.*available/i,
		});
		const unavailableDate = screen.getByRole("button", {
			name: /sun 02\/08.*unavailable/i,
		});
		expect(availableDate).toHaveAttribute("aria-pressed", "true");
		expect(unavailableDate).toHaveAttribute("aria-pressed", "false");

		const availableSlot = screen.getByRole("button", {
			name: /09:00.*available/i,
		});
		const unavailableSlot = screen.getByRole("button", {
			name: /09:30.*unavailable/i,
		});
		expect(availableSlot).toBeEnabled();
		expect(unavailableSlot).toBeDisabled();

		await userEvent.click(availableSlot);
		expect(onSelectSlot).toHaveBeenCalledWith(
			"2026-08-01",
			dates[0].doctors[0].slots[0],
		);
	});

	it("renders distinct loading, error/retry, and empty states", async () => {
		const onRetry = vi.fn();
		const commonProps = {
			dates: [],
			activeDate: "",
			onActiveDateChange: vi.fn(),
			onSelectSlot: vi.fn(),
			selectedDate: "",
			selectedTime: "",
		};
		const { rerender } = render(
			<DoctorSlotPicker {...commonProps} isLoading />,
		);
		expect(screen.getByRole("status")).toHaveTextContent(
			"Loading available slots",
		);

		rerender(<DoctorSlotPicker {...commonProps} isError onRetry={onRetry} />);
		expect(screen.getByRole("alert")).toHaveTextContent(
			"Could not load available slots",
		);
		await userEvent.click(screen.getByRole("button", { name: "Retry" }));
		expect(onRetry).toHaveBeenCalledOnce();

		rerender(<DoctorSlotPicker {...commonProps} />);
		expect(
			screen.getByText(
				"No upcoming schedule found for this doctor at this clinic.",
			),
		).toBeVisible();
	});
});

describe("buildExactDoctorScheduleParams", () => {
	it("filters the schedule request by doctor, clinic, and selected date", () => {
		expect(
			buildExactDoctorScheduleParams(
				"doctor-1",
				"clinic-1",
				"2026-08-15",
			),
		).toEqual({
			doctor_id: "doctor-1",
			clinic_id: "clinic-1",
			work_date: "2026-08-15",
			limit: 2,
		});
	});
});
