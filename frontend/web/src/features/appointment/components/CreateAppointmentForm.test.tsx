import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CreateAppointmentForm } from "./CreateAppointmentForm";
import { appointmentApi } from "../api/appointment.api";
import { BOOKING_TYPE } from "../constants/appointment.constant";

vi.mock("@iconify/react", () => ({
	Icon: ({ icon }: { icon: string }) => <span data-testid="icon">{icon}</span>,
}));

vi.mock("../api/appointment.api", () => ({
	appointmentApi: {
		findAvailability: vi.fn(),
	},
}));

describe("CreateAppointmentForm availability picker", () => {
	it("loads server-driven slots and submits the selected option token", async () => {
		vi.mocked(appointmentApi.findAvailability).mockResolvedValue({
			service: { id: "service-1", name: "Oral check", duration_minutes: 30 },
			dates: [
				{
					date: "2026-07-01",
					doctors: [
						{
							doctor_id: "doctor-1",
							clinic_id: "clinic-1",
							room: { room_id: "room-1", room_name: "Room 1" },
							slots: [
								{
									option_token: "slot-token-0900",
									start_time: "09:00",
									occupied_until: "09:55",
									status: "available",
								},
							],
						},
					],
				},
			],
		});
		const onSubmit = vi.fn();

		const { container } = render(
			<CreateAppointmentForm
				bookingType={BOOKING_TYPE.DOCTOR}
				patientId="patient-1"
				onSubmit={onSubmit}
				onCancel={vi.fn()}
				isSubmitting={false}
			/>,
		);

		await userEvent.type(
			screen.getByPlaceholderText("Enter clinic ID"),
			"clinic-1",
		);
		await userEvent.type(
			screen.getByPlaceholderText("Enter doctor ID"),
			"doctor-1",
		);
		await userEvent.type(
			screen.getByPlaceholderText("Enter service ID"),
			"service-1",
		);
		await userEvent.type(
			container.querySelector('input[type="date"]') as HTMLInputElement,
			"2026-07-01",
		);
		await userEvent.click(
			screen.getByRole("button", { name: "Find available slots" }),
		);

		expect(appointmentApi.findAvailability).toHaveBeenCalledWith({
			patient_id: "patient-1",
			clinic_id: "clinic-1",
			doctor_id: "doctor-1",
			service_id: "service-1",
			date_from: "2026-07-01",
			date_to: "2026-07-01",
		});
		await userEvent.click(await screen.findByRole("button", { name: /09:00/ }));
		await userEvent.click(
			screen.getByRole("button", { name: "Book Appointment" }),
		);

		await waitFor(() =>
			expect(onSubmit).toHaveBeenCalledWith(
				expect.objectContaining({
					option_token: "slot-token-0900",
					appointment_date: "2026-07-01",
					appointment_time: "09:00",
					doctor_id: "doctor-1",
					clinic_id: "clinic-1",
					room_id: "room-1",
					service_id: "service-1",
				}),
			),
		);
	});
});
