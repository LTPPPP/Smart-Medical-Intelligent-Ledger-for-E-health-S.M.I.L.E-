import ReactMarkdown, { type Components } from "react-markdown";

import type { BookingChatMessage } from "../types";
import {
	AppointmentActionList,
	BookingClinicPicker,
	BookingDoctorPicker,
	BookingSlotPicker,
	type AppointmentAction,
	type AppointmentPreview,
	type BookingOptionPreview,
	type ClinicOptionPreview,
	type DoctorOptionPreview,
} from "./BookingChatControls";

const markdownComponents: Components = {
	p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
	ul: ({ children }) => <ul className="mb-2 space-y-1 last:mb-0">{children}</ul>,
	ol: ({ children }) => (
		<ol className="mb-2 list-decimal space-y-1 pl-4 last:mb-0">{children}</ol>
	),
	li: ({ children }) => (
		<li className="flex gap-2">
			<span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-60" />
			<span>{children}</span>
		</li>
	),
	strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
	a: ({ children, href }) => (
		<a
			href={href}
			target="_blank"
			rel="noreferrer"
			className="underline underline-offset-2"
		>
			{children}
		</a>
	),
	code: ({ children }) => (
		<code className="rounded bg-black/10 px-1 py-0.5 text-[0.85em]">
			{children}
		</code>
	),
};

export function MessageText({ text }: { text: string }) {
	return (
		<div className="space-y-1">
			<ReactMarkdown components={markdownComponents}>{text}</ReactMarkdown>
		</div>
	);
}

export function AssistantDataCard({
	message,
	onSelectDoctor,
	onSelectClinic,
	onSelectSlot,
	onAppointmentAction,
	isSending,
}: {
	message: BookingChatMessage;
	onSelectDoctor: (
		doctor: DoctorOptionPreview,
		flow?: BookingChatMessage["flow"],
	) => void;
	onSelectClinic: (clinic: ClinicOptionPreview) => void;
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
	const clinicOptions = message.safeState?.clinic_options as
		| ClinicOptionPreview[]
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

	if (Array.isArray(clinicOptions) && clinicOptions.length > 0) {
		return (
			<BookingClinicPicker
				clinics={clinicOptions}
				disabled={isSending}
				onSelect={onSelectClinic}
			/>
		);
	}

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
