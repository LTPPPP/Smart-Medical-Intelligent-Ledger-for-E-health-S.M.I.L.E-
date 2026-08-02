import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
	AppointmentActionList,
	BookingDoctorPicker,
	BookingSlotPicker,
	buildAppointmentAction,
} from "./BookingChatControls";
import { AssistantDataCard } from "./ChatMessageView";

vi.mock("@/features/i18n", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@/features/i18n")>();
	return {
		...actual,
		useTranslation: () => ({
			t: (_key: string, fallback?: string) => fallback ?? _key,
			locale: "en" as const,
		}),
	};
});

vi.mock("@/features/i18n", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@/features/i18n")>();
	return {
		...actual,
		useTranslation: () => ({
			t: (_key: string, fallback?: string) => fallback ?? _key,
			locale: "en" as const,
		}),
	};
});

afterEach(() => cleanup());

describe("booking chat structured controls", () => {
	it("builds an opaque appointment action without putting the identifier in visible text", () => {
		const action = buildAppointmentAction("cancel", {
			id: "internal-appointment-id",
			appointment_code: "APT-001",
			appointment_date: "2026-06-24",
			appointment_time: "09:00",
		});

		expect(action.request).toEqual({
			action: "cancel_appointment",
			appointment_ref: "internal-appointment-id",
			message: "Cancel my selected appointment.",
		});
		expect(action.visibleText).toBe("Cancel 2026-06-24 at 09:00.");
		expect(action.visibleText).not.toContain("internal-appointment-id");
		expect(action.visibleText).not.toContain("APT-001");
	});

	it("renders human-readable appointment cards and emits a structured action", async () => {
		const onAction = vi.fn();
		render(
			<AppointmentActionList
				appointments={[
					{
						id: "internal-appointment-id",
						appointment_code: "APT-001",
						appointment_date: "2026-06-24",
						appointment_time: "09:00",
						service_name: "Oral checking",
						doctor_name: "Dr. An",
					},
				]}
				disabled={false}
				onAction={onAction}
			/>,
		);

		expect(screen.getByText("Oral checking")).toBeInTheDocument();
		expect(
			screen.queryByText("internal-appointment-id"),
		).not.toBeInTheDocument();
		await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
		expect(onAction).toHaveBeenCalledWith(
			expect.objectContaining({
				request: expect.objectContaining({ action: "cancel_appointment" }),
			}),
		);
	});

	it("renders a focused reschedule selector without a cancel action", async () => {
		const onAction = vi.fn();
		render(
			<AppointmentActionList
				appointments={[
					{
						id: "appt-1000",
						appointment_date: "2026-06-25",
						appointment_time: "10:00",
						service_name: "Oral checking",
						doctor_name: "Dr. Nguyen Van A",
					},
				]}
				disabled={false}
				preferredAction="reschedule"
				onAction={onAction}
			/>,
		);

		expect(
			screen.getByRole("button", { name: "Select for reschedule" }),
		).toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: "Cancel" }),
		).not.toBeInTheDocument();

		await userEvent.click(
			screen.getByRole("button", { name: "Select for reschedule" }),
		);
		expect(onAction).toHaveBeenCalledWith(
			expect.objectContaining({
				request: expect.objectContaining({
					action: "reschedule_appointment",
					appointment_ref: "appt-1000",
				}),
				visibleText: "Reschedule 2026-06-25 at 10:00.",
			}),
		);
	});

	it("renders appointment metadata as separate readable rows", () => {
		render(
			<AppointmentActionList
				appointments={[
					{
						id: "internal-appointment-id",
						appointment_date: "2026-06-24",
						appointment_time: "14:00",
						service_name: "Oral checking",
						doctor_name: "Dr. Nguyen Van A",
						room_name: "Phòng khám tổng quát 1",
						clinic_name: "Nha Khoa S.M.I.L.E - Hồ Chí Minh",
					},
				]}
				disabled={false}
				onAction={vi.fn()}
			/>,
		);

		expect(screen.getByText("Date")).toBeInTheDocument();
		expect(screen.getByText("Doctor")).toBeInTheDocument();
		expect(screen.getByText("Room")).toBeInTheDocument();
		expect(screen.getByText("Clinic")).toBeInTheDocument();
		expect(
			screen.queryByText(/Dr\. Nguyen Van A • Phòng khám tổng quát 1/),
		).not.toBeInTheDocument();
	});

	it("renders slot choices without a confirmation control", () => {
		render(
			<BookingSlotPicker
				options={[
					{
						id: "slot-1",
						appointment_time: "09:00",
						doctor_name: "Dr. An",
						room_name: "Room 1",
					},
					{
						id: "slot-2",
						appointment_time: "09:30",
						doctor_name: "Dr. An",
						room_name: "Room 1",
					},
				]}
				disabled={false}
				onSelect={vi.fn()}
			/>,
		);

		expect(screen.getByRole("button", { name: /09:00/ })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /09:30/ })).toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: "Confirm" }),
		).not.toBeInTheDocument();
	});

	it("renders doctor choices before time choices and emits the selected doctor", async () => {
		const onSelect = vi.fn();
		render(
			<BookingDoctorPicker
				doctors={[
					{
						doctor_id: "doctor-a",
						doctor_name: "Dr. A",
						clinic_name: "SMILE clinic",
					},
					{
						doctor_id: "doctor-b",
						doctor_name: "Dr. B",
						clinic_name: "SMILE clinic",
					},
				]}
				disabled={false}
				onSelect={onSelect}
			/>,
		);

		expect(
			screen.queryByText("Choose an available slot"),
		).not.toBeInTheDocument();
		await userEvent.click(screen.getByRole("button", { name: /Dr. B/ }));
		expect(onSelect).toHaveBeenCalledWith(
			expect.objectContaining({ doctor_id: "doctor-b" }),
		);
	});

	it("shows a previous-doctor recommendation without hiding other doctors", () => {
		render(
			<BookingSlotPicker
				options={[
					{
						id: "slot-1",
						appointment_time: "09:00",
						doctor_name: "Dr. Nguyen Van A",
						room_name: "Room 1",
					},
					{
						id: "slot-2",
						appointment_time: "09:30",
						doctor_name: "Dr. Tran Thi B",
						room_name: "Room 2",
					},
				]}
				recommendedDoctor={{
					doctor_id: "doctor-a",
					doctor_name: "Dr. Nguyen Van A",
				}}
				disabled={false}
				onSelect={vi.fn()}
			/>,
		);

		expect(
			screen.getByText(/Recommended: Dr. Nguyen Van A/),
		).toBeInTheDocument();
		expect(
			screen.getByText(/Other available doctors are still listed/),
		).toBeInTheDocument();
		expect(screen.getByText(/Dr. Tran Thi B/)).toBeInTheDocument();
	});

	it("marks booked slots as unavailable and keeps available slots selectable", () => {
		render(
			<BookingSlotPicker
				options={[
					{
						id: "slot-1",
						appointment_time: "09:00",
						doctor_name: "Dr. An",
						room_name: "Room 1",
						status: "available",
					},
					{
						id: "slot-2",
						appointment_time: "09:30",
						doctor_name: "Dr. An",
						room_name: "Room 1",
						status: "booked",
					},
				]}
				disabled={false}
				onSelect={vi.fn()}
			/>,
		);

		expect(screen.getByRole("button", { name: /09:00/ })).toBeEnabled();
		expect(screen.getByRole("button", { name: /09:30/ })).toBeDisabled();
		expect(screen.getByText("Booked")).toBeInTheDocument();
	});

	it("does not render the slot picker again after a slot was selected", () => {
		render(
			<AssistantDataCard
				message={{
					id: "message-1",
					role: "assistant",
					text: "Please confirm the selected slot below.",
					flow: "booking",
					safeState: {
						booking_option_selected: true,
						booking_option: {
							id: "slot-1",
							appointment_time: "09:15",
							doctor_name: "Dr. An",
						},
						booking_options: [
							{
								id: "slot-1",
								appointment_time: "09:15",
								doctor_name: "Dr. An",
							},
						],
					},
				}}
				isSending={false}
				onAppointmentAction={vi.fn()}
				onSelectDoctor={vi.fn()}
				onSelectSlot={vi.fn()}
			/>,
		);

		expect(
			screen.queryByText("Choose an available slot"),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: /09:15/ }),
		).not.toBeInTheDocument();
	});

	it("renders time choices when the assistant returns booking options without a selected option", () => {
		render(
			<AssistantDataCard
				message={{
					id: "message-1",
					role: "assistant",
					text: "Choose an available time below.",
					flow: "booking",
					safeState: {
						selected_doctor_id: "doctor-a",
						booking_options: [
							{
								id: "slot-1",
								appointment_time: "10:00",
								doctor_name: "Dr. An",
								room_name: "Room 1",
							},
							{
								id: "slot-2",
								appointment_time: "10:30",
								doctor_name: "Dr. An",
								room_name: "Room 1",
							},
						],
					},
				}}
				isSending={false}
				onAppointmentAction={vi.fn()}
				onSelectDoctor={vi.fn()}
				onSelectSlot={vi.fn()}
			/>,
		);

		expect(screen.getByText("Choose an available slot")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /10:00/ })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /10:30/ })).toBeInTheDocument();
	});

	it("passes reschedule appointment-selection intent from assistant safe state", () => {
		render(
			<AssistantDataCard
				message={{
					id: "message-1",
					role: "assistant",
					text: "Please choose which appointment you want to reschedule below.",
					flow: "reschedule",
					safeState: {
						appointment_selection_action: "reschedule",
						appointments: [
							{
								id: "appt-1000",
								appointment_date: "2026-06-25",
								appointment_time: "10:00",
								service_name: "Oral checking",
							},
						],
					},
				}}
				isSending={false}
				onAppointmentAction={vi.fn()}
				onSelectDoctor={vi.fn()}
				onSelectSlot={vi.fn()}
			/>,
		);

		expect(
			screen.getByRole("button", { name: "Select for reschedule" }),
		).toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: "Cancel" }),
		).not.toBeInTheDocument();
	});
});
