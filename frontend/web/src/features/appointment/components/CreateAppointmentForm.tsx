"use client";

import { useState } from "react";

import { Icon } from "@iconify/react";

import { Input } from "@/shared/components/common/Input";

import { appointmentApi } from "../api/appointment.api";
import { BookingType, BOOKING_TYPE } from "../constants/appointment.constant";
import type {
	AppointmentAvailabilityDoctor,
	AppointmentAvailabilityResponse,
	AppointmentAvailabilitySlot,
} from "../types/appointment.type";

interface CreateAppointmentFormProps {
	bookingType: BookingType;
	patientId?: string;
	onSubmit: (data: Record<string, unknown>) => void;
	onCancel: () => void;
	isSubmitting: boolean;
}

export function CreateAppointmentForm({
	bookingType,
	patientId,
	onSubmit,
	onCancel,
	isSubmitting,
}: CreateAppointmentFormProps) {
	const [formData, setFormData] = useState<Record<string, string>>({
		clinic_id: "",
		doctor_id: "",
		specialty_id: "",
		service_id: "",
		room_id: "",
		appointment_date: "",
		appointment_time: "",
		notes: "",
		chief_complaint: "",
		outside_hours_reason: "",
	});

	const [errors, setErrors] = useState<Record<string, string>>({});
	const [availability, setAvailability] =
		useState<AppointmentAvailabilityResponse | null>(null);
	const [availabilityError, setAvailabilityError] = useState<string | null>(
		null,
	);
	const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
	const [selectedSlotToken, setSelectedSlotToken] = useState<string | null>(
		null,
	);
	const usesAvailability = bookingType !== BOOKING_TYPE.OUTSIDE_HOURS;

	const validate = () => {
		const newErrors: Record<string, string> = {};

		if (!formData.clinic_id) newErrors.clinic_id = "Please enter clinic ID";
		if (!formData.appointment_date)
			newErrors.appointment_date = "Please select a date";
		if (usesAvailability && !formData.service_id)
			newErrors.service_id = "Please enter service ID";
		if (usesAvailability && !selectedSlotToken)
			newErrors.appointment_time = "Please select an available slot";
		if (!usesAvailability && !formData.appointment_time)
			newErrors.appointment_time = "Please select a time";

		if (
			(bookingType === BOOKING_TYPE.CLINIC ||
				bookingType === BOOKING_TYPE.DOCTOR ||
				bookingType === BOOKING_TYPE.OUTSIDE_HOURS) &&
			!formData.doctor_id
		) {
			newErrors.doctor_id = "Please enter doctor ID";
		}
		if (bookingType === BOOKING_TYPE.SPECIALTY && !formData.specialty_id) {
			newErrors.specialty_id = "Please enter specialty ID";
		}
		if (
			bookingType === BOOKING_TYPE.OUTSIDE_HOURS &&
			!formData.outside_hours_reason
		) {
			newErrors.outside_hours_reason =
				"Please describe why outside-hours booking is needed";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = () => {
		if (!validate()) return;
		onSubmit(formData);
	};

	const set =
		(key: string) =>
		(
			e: React.ChangeEvent<
				HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
			>,
		) => {
			if (
				["clinic_id", "doctor_id", "service_id", "appointment_date"].includes(
					key,
				)
			) {
				setSelectedSlotToken(null);
				setAvailability(null);
			}
			setFormData((prev) => ({ ...prev, [key]: e.target.value }));
		};

	const validateAvailabilitySearch = () => {
		const newErrors: Record<string, string> = {};
		if (!patientId)
			newErrors.patient_id = "Please sign in again before searching slots";
		if (!formData.clinic_id) newErrors.clinic_id = "Please enter clinic ID";
		if (!formData.service_id) newErrors.service_id = "Please enter service ID";
		if (!formData.appointment_date)
			newErrors.appointment_date = "Please select a date";
		if (
			(bookingType === BOOKING_TYPE.CLINIC ||
				bookingType === BOOKING_TYPE.DOCTOR) &&
			!formData.doctor_id
		) {
			newErrors.doctor_id = "Please enter doctor ID";
		}
		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleFindAvailability = async () => {
		if (!validateAvailabilitySearch() || !patientId) return;

		setIsLoadingAvailability(true);
		setAvailabilityError(null);
		setSelectedSlotToken(null);

		try {
			const response = await appointmentApi.findAvailability({
				patient_id: patientId,
				clinic_id: formData.clinic_id,
				doctor_id: formData.doctor_id || undefined,
				service_id: formData.service_id,
				date_from: formData.appointment_date,
				date_to: formData.appointment_date,
			});
			setAvailability(response);
		} catch {
			setAvailabilityError("Failed to load available slots");
		} finally {
			setIsLoadingAvailability(false);
		}
	};

	const handleSelectSlot = (
		date: string,
		doctor: AppointmentAvailabilityDoctor,
		slot: AppointmentAvailabilitySlot,
	) => {
		if (slot.status !== "available" || !slot.option_token) return;
		const optionToken = slot.option_token;
		setSelectedSlotToken(optionToken);
		setErrors((prev) => {
			const rest = { ...prev };
			delete rest.appointment_time;
			return rest;
		});
		setFormData((prev) => ({
			...prev,
			option_token: optionToken,
			appointment_date: date,
			appointment_time: slot.start_time,
			clinic_id: doctor.clinic_id || prev.clinic_id,
			doctor_id: doctor.doctor_id || prev.doctor_id,
			room_id: doctor.room?.room_id || prev.room_id,
			service_id: availability?.service?.id || prev.service_id,
		}));
	};

	const slotOptions =
		availability?.dates.flatMap((date) =>
			date.doctors.flatMap((doctor) =>
				doctor.slots.map((slot) => ({ date: date.date, doctor, slot })),
			),
		) ?? [];

	return (
		<div className="space-y-4">
			<div>
				<Input
					label="Clinic ID *"
					value={formData.clinic_id}
					onChange={set("clinic_id")}
					placeholder="Enter clinic ID"
				/>
				{errors.clinic_id && (
					<p className="text-red-500 text-xs mt-1">{errors.clinic_id}</p>
				)}
			</div>

			{(bookingType === BOOKING_TYPE.CLINIC ||
				bookingType === BOOKING_TYPE.DOCTOR ||
				bookingType === BOOKING_TYPE.OUTSIDE_HOURS) && (
				<div>
					<Input
						label="Doctor ID *"
						value={formData.doctor_id}
						onChange={set("doctor_id")}
						placeholder="Enter doctor ID"
					/>
					{errors.doctor_id && (
						<p className="text-red-500 text-xs mt-1">{errors.doctor_id}</p>
					)}
				</div>
			)}

			{bookingType === BOOKING_TYPE.SPECIALTY && (
				<div>
					<Input
						label="Specialty ID *"
						value={formData.specialty_id}
						onChange={set("specialty_id")}
						placeholder="Enter specialty ID"
					/>
					{errors.specialty_id && (
						<p className="text-red-500 text-xs mt-1">{errors.specialty_id}</p>
					)}
				</div>
			)}

			{bookingType === BOOKING_TYPE.OUTSIDE_HOURS && (
				<div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
					<div className="flex items-start gap-2">
						<Icon
							icon="mdi:alert"
							className="text-orange-600 mt-0.5"
							width={20}
						/>
						<p className="text-sm text-orange-800">
							Emergency booking outside regular working hours. Additional
							charges may apply.
						</p>
					</div>
				</div>
			)}

			<div>
				<Input
					label={usesAvailability ? "Service ID *" : "Service ID (Optional)"}
					value={formData.service_id}
					onChange={set("service_id")}
					placeholder="Enter service ID"
				/>
				{errors.service_id && (
					<p className="text-red-500 text-xs mt-1">{errors.service_id}</p>
				)}
			</div>

			<div>
				<Input
					label="Room ID (Optional)"
					value={formData.room_id}
					onChange={set("room_id")}
					placeholder="Enter treatment room ID"
				/>
			</div>

			<div className={usesAvailability ? "" : "grid grid-cols-2 gap-4"}>
				<div>
					<Input
						label="Date *"
						type="date"
						value={formData.appointment_date}
						onChange={set("appointment_date")}
						min={new Date().toISOString().split("T")[0]}
					/>
					{errors.appointment_date && (
						<p className="text-red-500 text-xs mt-1">
							{errors.appointment_date}
						</p>
					)}
				</div>

				{!usesAvailability && (
					<div>
						<Input
							label="Time *"
							type="time"
							value={formData.appointment_time}
							onChange={set("appointment_time")}
							step={900}
						/>
						{errors.appointment_time && (
							<p className="text-red-500 text-xs mt-1">
								{errors.appointment_time}
							</p>
						)}
					</div>
				)}
			</div>

			{usesAvailability && (
				<div className="rounded-lg border border-gray-200 p-4">
					<div className="flex items-center justify-between gap-3">
						<div>
							<h3 className="text-sm font-semibold text-gray-800">
								Available slots
							</h3>
							<p className="text-xs text-gray-500">
								Choose a server-confirmed option before booking.
							</p>
						</div>
						<button
							type="button"
							onClick={handleFindAvailability}
							disabled={isLoadingAvailability || isSubmitting}
							className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
						>
							{isLoadingAvailability
								? "Loading slots..."
								: "Find available slots"}
						</button>
					</div>

					{errors.patient_id && (
						<p className="mt-2 text-xs text-red-500">{errors.patient_id}</p>
					)}
					{availabilityError && (
						<p className="mt-2 text-xs text-red-500">{availabilityError}</p>
					)}
					{errors.appointment_time && (
						<p className="mt-2 text-xs text-red-500">
							{errors.appointment_time}
						</p>
					)}

					{slotOptions.length > 0 && (
						<div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
							{slotOptions.map(({ date, doctor, slot }) => (
								<button
									key={slot.option_token}
									type="button"
									onClick={() => handleSelectSlot(date, doctor, slot)}
									className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
										selectedSlotToken === slot.option_token
											? "border-blue-600 bg-blue-50 text-blue-900"
											: "border-gray-200 hover:bg-gray-50"
									}`}
								>
									<span className="block font-semibold">{slot.start_time}</span>
									<span className="block text-xs text-gray-500">
										{date} · Doctor {doctor.doctor_id}
										{doctor.room?.room_name
											? ` · ${doctor.room.room_name}`
											: ""}
									</span>
								</button>
							))}
						</div>
					)}

					{availability && slotOptions.length === 0 && (
						<p className="mt-3 text-sm text-gray-500">
							No slots are available for the selected filters.
						</p>
					)}
				</div>
			)}

			<div>
				<label className="block text-sm font-medium mb-2">
					Reason for Visit
				</label>
				<textarea
					className="w-full px-3 py-2 border rounded-lg"
					rows={3}
					placeholder="Describe your reason for visit..."
					value={formData.chief_complaint}
					onChange={set("chief_complaint")}
				/>
			</div>

			{bookingType === BOOKING_TYPE.OUTSIDE_HOURS && (
				<div>
					<label className="block text-sm font-medium mb-2">
						Outside-hours reason *
					</label>
					<textarea
						className="w-full px-3 py-2 border rounded-lg"
						rows={2}
						placeholder="Why does this appointment need to be outside working hours?"
						value={formData.outside_hours_reason}
						onChange={set("outside_hours_reason")}
					/>
					{errors.outside_hours_reason && (
						<p className="text-red-500 text-xs mt-1">
							{errors.outside_hours_reason}
						</p>
					)}
				</div>
			)}

			<div>
				<label className="block text-sm font-medium mb-2">
					Additional Notes (Optional)
				</label>
				<textarea
					className="w-full px-3 py-2 border rounded-lg"
					rows={2}
					placeholder="Any additional notes..."
					value={formData.notes}
					onChange={set("notes")}
				/>
			</div>

			<div className="flex gap-3 justify-end pt-4 border-t">
				<button
					type="button"
					onClick={onCancel}
					disabled={isSubmitting}
					className="px-6 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
				>
					Cancel
				</button>
				<button
					type="button"
					onClick={handleSubmit}
					disabled={isSubmitting}
					className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
				>
					{isSubmitting && <Icon icon="line-md:loading-twotone-loop" />}
					Book Appointment
				</button>
			</div>
		</div>
	);
}
