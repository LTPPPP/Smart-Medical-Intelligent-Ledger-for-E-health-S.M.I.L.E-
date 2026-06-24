import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AppointmentActionList, BookingSlotPicker, buildAppointmentAction } from "./BookingChatControls";

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
        appointments={[{
          id: "internal-appointment-id",
          appointment_code: "APT-001",
          appointment_date: "2026-06-24",
          appointment_time: "09:00",
          service_name: "Oral checking",
          doctor_name: "Dr. An",
        }]}
        disabled={false}
        onAction={onAction}
      />,
    );

    expect(screen.getByText("Oral checking")).toBeInTheDocument();
    expect(screen.queryByText("internal-appointment-id")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onAction).toHaveBeenCalledWith(expect.objectContaining({
      request: expect.objectContaining({ action: "cancel_appointment" }),
    }));
  });

  it("renders slot choices without a confirmation control", () => {
    render(
      <BookingSlotPicker
        options={[
          { id: "slot-1", appointment_time: "09:00", doctor_name: "Dr. An", room_name: "Room 1" },
          { id: "slot-2", appointment_time: "09:30", doctor_name: "Dr. An", room_name: "Room 1" },
        ]}
        disabled={false}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: /09:00/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /09:30/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Confirm" })).not.toBeInTheDocument();
  });

  it("marks booked slots as unavailable and keeps available slots selectable", () => {
    render(
      <BookingSlotPicker
        options={[
          { id: "slot-1", appointment_time: "09:00", doctor_name: "Dr. An", room_name: "Room 1", status: "available" },
          { id: "slot-2", appointment_time: "09:30", doctor_name: "Dr. An", room_name: "Room 1", status: "booked" },
        ]}
        disabled={false}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: /09:00/ })).toBeEnabled();
    expect(screen.getByRole("button", { name: /09:30/ })).toBeDisabled();
    expect(screen.getByText("Booked")).toBeInTheDocument();
  });
});
