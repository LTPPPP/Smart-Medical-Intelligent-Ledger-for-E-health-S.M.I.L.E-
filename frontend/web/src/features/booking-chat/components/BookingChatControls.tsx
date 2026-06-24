import type { BookingChatActionRequest, BookingChatFlow } from "../types";

export type BookingOptionPreview = {
  id?: string;
  summary?: string;
  appointment_date?: string;
  appointment_time?: string;
  duration_minutes?: number;
  doctor_name?: string;
  clinic_name?: string;
  room_name?: string;
  service_name?: string;
  status?: "available" | "booked" | string;
};

export type RecommendedDoctorPreview = {
  doctor_id?: string;
  doctor_name?: string;
};

export type DoctorOptionPreview = RecommendedDoctorPreview & {
  clinic_name?: string;
};

export type AppointmentPreview = {
  id?: string;
  appointment_id?: string;
  appointment_code?: string;
  appointment_date?: string;
  appointment_time?: string;
  duration_minutes?: number;
  status?: string;
  service_name?: string;
  doctor_name?: string;
  clinic_name?: string;
  room_name?: string;
};

export type AppointmentAction = {
  request: BookingChatActionRequest;
  visibleText: string;
};

export function appointmentRefOf(item: AppointmentPreview) {
  return item.id ?? item.appointment_id ?? item.appointment_code ?? "";
}

export function appointmentLabel(item: AppointmentPreview) {
  const schedule = [item.appointment_date, item.appointment_time].filter(Boolean).join(" at ");
  return schedule || item.service_name || "the selected appointment";
}

export function slotLabel(item: BookingOptionPreview) {
  return [item.appointment_date, item.appointment_time].filter(Boolean).join(" at ")
    || item.summary
    || "Available SMILE slot";
}

export function buildAppointmentAction(
  kind: "cancel" | "reschedule",
  appointment: AppointmentPreview,
): AppointmentAction {
  const verb = kind === "cancel" ? "Cancel" : "Reschedule";
  return {
    request: {
      action: `${kind}_appointment`,
      appointment_ref: appointmentRefOf(appointment),
      message: `${verb} my selected appointment.`,
    },
    visibleText: `${verb} ${appointmentLabel(appointment)}.`,
  };
}

export function buildSlotSelectionMessage(
  item: BookingOptionPreview,
  flow?: BookingChatFlow,
) {
  const details = [
    item.service_name ? `service: ${item.service_name}` : "",
    item.appointment_date ? `preferred date: ${item.appointment_date}` : "",
    item.appointment_time ? `preferred time: ${item.appointment_time}` : "",
    item.doctor_name ? `doctor: ${item.doctor_name}` : "",
    item.room_name ? `room: ${item.room_name}` : "",
    item.clinic_name ? `clinic: ${item.clinic_name}` : "",
  ].filter(Boolean);
  const intent = flow === "reschedule" ? "Reschedule my selected appointment" : "Book a SMILE dental appointment";
  return `${intent}. ${details.join("; ")}. Please prepare this exact slot for confirmation.`;
}

export function BookingSlotPicker({
  options,
  recommendedDoctor,
  disabled,
  onSelect,
}: {
  options: BookingOptionPreview[];
  recommendedDoctor?: RecommendedDoctorPreview;
  disabled: boolean;
  onSelect: (option: BookingOptionPreview) => void;
}) {
  const groups = Map.groupBy(options, (item) => (
    [item.doctor_name, item.room_name, item.clinic_name].filter(Boolean).join(" • ") || "SMILE slot"
  ));

  return (
    <div className="mt-3 space-y-3 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-950">
      <p className="font-semibold">Choose an available slot</p>
      {recommendedDoctor?.doctor_name ? (
        <p className="text-emerald-800">
          Recommended: {recommendedDoctor.doctor_name}, based on your previous appointment. Other available doctors are still listed.
        </p>
      ) : null}
      {Array.from(groups, ([title, items]) => (
        <section key={title} className="rounded border border-emerald-100 bg-white p-2">
          <p className="font-medium">{title}</p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {items.map((item) => {
              const isBooked = item.status === "booked";
              return (
                <button
                  key={item.id ?? slotLabel(item)}
                  type="button"
                  disabled={disabled || isBooked}
                  onClick={() => onSelect(item)}
                  className={isBooked
                    ? "rounded border border-rose-200 bg-rose-50 px-2 py-2 text-left text-rose-900 disabled:opacity-100"
                    : "rounded border border-emerald-200 bg-white px-2 py-2 text-left text-emerald-950 hover:border-emerald-400 disabled:opacity-60"}
                >
                  <span className="block font-semibold">{item.appointment_time ?? slotLabel(item)}</span>
                  {item.duration_minutes ? <span>{item.duration_minutes} min</span> : null}
                  {isBooked ? <span className="block text-[11px] font-medium">Booked</span> : null}
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

export function BookingDoctorPicker({
  doctors,
  recommendedDoctor,
  disabled,
  onSelect,
}: {
  doctors: DoctorOptionPreview[];
  recommendedDoctor?: RecommendedDoctorPreview;
  disabled: boolean;
  onSelect: (doctor: DoctorOptionPreview) => void;
}) {
  return (
    <div className="mt-3 space-y-2 rounded-md border border-sky-200 bg-sky-50 p-3 text-xs text-slate-800">
      <p className="font-semibold text-slate-950">Choose a doctor</p>
      {doctors.map((doctor) => {
        const recommended = doctor.doctor_id === recommendedDoctor?.doctor_id;
        return (
          <button
            key={doctor.doctor_id ?? doctor.doctor_name}
            type="button"
            disabled={disabled || !doctor.doctor_id}
            onClick={() => onSelect(doctor)}
            className="flex w-full items-center justify-between rounded border border-sky-200 bg-white px-3 py-3 text-left hover:border-sky-400 disabled:opacity-60"
          >
            <span>
              <span className="block font-semibold text-slate-950">{doctor.doctor_name ?? "Available doctor"}</span>
              {doctor.clinic_name ? <span className="mt-1 block text-slate-500">{doctor.clinic_name}</span> : null}
            </span>
            {recommended ? <span className="font-medium text-sky-700">Previous doctor</span> : null}
          </button>
        );
      })}
    </div>
  );
}

export function AppointmentActionList({
  appointments,
  disabled,
  preferredAction,
  onAction,
}: {
  appointments: AppointmentPreview[];
  disabled: boolean;
  preferredAction?: "cancel" | "reschedule";
  onAction: (action: AppointmentAction) => void;
}) {
  const actions: Array<"cancel" | "reschedule"> = preferredAction ? [preferredAction] : ["reschedule", "cancel"];
  const heading = preferredAction === "reschedule"
    ? "Choose appointment to reschedule"
    : preferredAction === "cancel"
      ? "Choose appointment to cancel"
      : "Upcoming appointments";

  return (
    <div className="mt-3 space-y-2 rounded-md border border-slate-200 bg-white p-3 text-xs text-slate-700">
      <p className="font-semibold text-slate-900">{heading}</p>
      {appointments.slice(0, 4).map((appointment) => (
        <article key={appointmentRefOf(appointment)} className="rounded-md border border-slate-100 p-3">
          <p className="font-medium text-slate-950">{appointment.service_name ?? "Dental appointment"}</p>
          <dl className="mt-2 space-y-1.5">
            <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-2">
              <dt className="font-medium text-slate-500">Date</dt>
              <dd className="min-w-0 text-slate-800">{appointmentLabel(appointment)}</dd>
            </div>
            {appointment.doctor_name ? (
              <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-2">
                <dt className="font-medium text-slate-500">Doctor</dt>
                <dd className="min-w-0 text-slate-800">{appointment.doctor_name}</dd>
              </div>
            ) : null}
            {appointment.room_name ? (
              <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-2">
                <dt className="font-medium text-slate-500">Room</dt>
                <dd className="min-w-0 text-slate-800">{appointment.room_name}</dd>
              </div>
            ) : null}
            {appointment.clinic_name ? (
              <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-2">
                <dt className="font-medium text-slate-500">Clinic</dt>
                <dd className="min-w-0 text-slate-800">{appointment.clinic_name}</dd>
              </div>
            ) : null}
          </dl>
          <div className={`mt-3 grid gap-2 ${actions.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
            {actions.map((action) => {
              const label = preferredAction
                ? `Select for ${action}`
                : action === "reschedule" ? "Reschedule" : "Cancel";
              return (
                <button
                  key={action}
                  type="button"
                  disabled={disabled}
                  onClick={() => onAction(buildAppointmentAction(action, appointment))}
                  className={action === "reschedule"
                    ? "rounded border border-slate-200 px-2 py-1.5 font-medium text-slate-700 hover:border-sky-300 hover:text-sky-700 disabled:opacity-60"
                    : "rounded border border-slate-200 px-2 py-1.5 font-medium text-slate-700 hover:border-rose-300 hover:text-rose-700 disabled:opacity-60"}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </article>
      ))}
    </div>
  );
}
