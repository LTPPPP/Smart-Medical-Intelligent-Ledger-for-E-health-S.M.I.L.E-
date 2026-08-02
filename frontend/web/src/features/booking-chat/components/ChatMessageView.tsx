import type { BookingChatMessage } from "../types";
import {
	AppointmentActionList,
	BookingDoctorPicker,
	BookingSlotPicker,
	type AppointmentAction,
	type AppointmentPreview,
	type BookingOptionPreview,
	type DoctorOptionPreview,
} from "./BookingChatControls";

export function MessageText({ text }: { text: string }) {
	const lines = text
		.split(/\n+/)
		.map((line) => line.trim())
		.filter(Boolean);
	const shouldList =
		lines.length > 1 || lines.some((line) => /^[-*]\s+/.test(line));
	if (!shouldList) return <p>{text}</p>;
	return (
		<div className="space-y-2">
			{lines.map((line, index) => {
				const isBullet = /^[-*]\s+/.test(line);
				return isBullet ? (
					<div key={`${line}-${index}`} className="flex gap-2">
						<span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-60" />
						<span>{line.replace(/^[-*]\s+/, "")}</span>
					</div>
				) : (
					<p key={`${line}-${index}`}>{line}</p>
				);
			})}
		</div>
	);
}

export function AssistantDataCard({
	message,
	onSelectDoctor,
	onSelectSlot,
	onAppointmentAction,
	isSending,
}: {
	message: BookingChatMessage;
	onSelectDoctor: (
		doctor: DoctorOptionPreview,
		flow?: BookingChatMessage["flow"],
	) => void;
	onSelectSlot: (
		option: BookingOptionPreview,
		flow?: BookingChatMessage["flow"],
	) => void;
	onAppointmentAction: (action: AppointmentAction) => void;
	isSending: boolean;
}) {
	const option = message.safeState?.booking_option as
		| BookingOptionPreview
		| undefined;
	const options = message.safeState?.booking_options as
		| BookingOptionPreview[]
		| undefined;
	const doctorOptions = message.safeState?.doctor_options as
		| DoctorOptionPreview[]
		| undefined;
	const optionSelected = message.safeState?.booking_option_selected === true;
	const recommendedDoctor = message.safeState?.recommended_doctor as
		| { doctor_id?: string; doctor_name?: string }
		| undefined;
	const appointments = message.safeState?.appointments as
		| AppointmentPreview[]
		| undefined;
	const appointmentSelectionAction =
		message.safeState?.appointment_selection_action;
	const preferredAppointmentAction =
		appointmentSelectionAction === "reschedule" ||
		appointmentSelectionAction === "cancel"
			? appointmentSelectionAction
			: undefined;

	if (Array.isArray(doctorOptions) && doctorOptions.length > 0) {
		return (
			<BookingDoctorPicker
				doctors={doctorOptions}
				recommendedDoctor={recommendedDoctor}
				disabled={isSending}
				onSelect={(doctor) => onSelectDoctor(doctor, message.flow)}
			/>
		);
	}

	if (optionSelected) {
		return null;
	}

	if (Array.isArray(options) && options.length > 0) {
		return (
			<BookingSlotPicker
				options={options}
				recommendedDoctor={recommendedDoctor}
				disabled={isSending}
				onSelect={(item) => onSelectSlot(item, message.flow)}
			/>
		);
	}

	if (option) {
		return (
			<BookingSlotPicker
				options={[option]}
				recommendedDoctor={recommendedDoctor}
				disabled={isSending}
				onSelect={(item) => onSelectSlot(item, message.flow)}
			/>
		);
	}

	if (Array.isArray(appointments) && appointments.length > 0) {
		return (
			<AppointmentActionList
				appointments={appointments}
				disabled={isSending}
				preferredAction={preferredAppointmentAction}
				onAction={onAppointmentAction}
			/>
		);
	}

	return null;
}
