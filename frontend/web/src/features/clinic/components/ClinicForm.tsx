import { useState } from "react";

import { Icon } from "@iconify/react";

import {
	CLINIC_STATUS_OPTIONS,
	ClinicStatus,
	DAYS_OF_WEEK,
	DEFAULT_OPERATING_HOURS,
} from "@/features/clinic/constants/clinic.constant";
import {
	Clinic,
	CreateClinicRequest,
	UpdateClinicRequest,
} from "@/features/clinic/types/clinic.type";
import { Input } from "@/shared/components/common/Input";
import { EMAIL_REGEX } from "@/shared/constants";

interface ClinicFormProps {
	clinic?: Clinic;
	onSubmit: (data: CreateClinicRequest | UpdateClinicRequest) => Promise<void>;
	onCancel: () => void;
	isSubmitting?: boolean;
}

export const ClinicForm = ({
	clinic,
	onSubmit,
	onCancel,
	isSubmitting,
}: ClinicFormProps) => {
	const [formData, setFormData] = useState({
		clinicName: clinic?.clinicName || "",
		clinicCode: clinic?.clinicCode || "",
		address: clinic?.address || "",
		ward: clinic?.ward || "",
		district: clinic?.district || "",
		city: clinic?.city || "",
		phone: clinic?.phone || "",
		email: clinic?.email || "",
		website: clinic?.website || "",
		licenseNumber: clinic?.licenseNumber || "",
		licenseExpiry: clinic?.licenseExpiry || "",
		status: (clinic?.status || "active") as ClinicStatus,
	});

	const [operatingHours, setOperatingHours] = useState<Record<string, string>>(
		clinic?.operatingHours || DEFAULT_OPERATING_HOURS,
	);

	const [errors, setErrors] = useState<Record<string, string>>({});

	const validate = () => {
		const newErrors: Record<string, string> = {};

		if (!formData.clinicName.trim())
			newErrors.clinicName = "Clinic name is required";
		if (!clinic && !formData.clinicCode.trim())
			newErrors.clinicCode = "Clinic code is required";
		if (!formData.address.trim()) newErrors.address = "Address is required";
		if (formData.email && !EMAIL_REGEX.test(formData.email)) {
			newErrors.email = "Invalid email format";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async () => {
		if (!validate()) return;

		const submitData = {
			...formData,
			operatingHours,
		};

		await onSubmit(submitData);
	};

	return (
		<div className="space-y-6">
			{/* Basic Information */}
			<div className="bg-white rounded-xl p-6 shadow-sm">
				<h3 className="text-lg font-bold mb-4 flex items-center gap-2">
					<Icon icon="mdi:information" className="text-blue-600" width={24} />
					Basic Information
				</h3>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<Input
							label="Clinic Name *"
							value={formData.clinicName}
							onChange={(e) =>
								setFormData({ ...formData, clinicName: e.target.value })
							}
							placeholder="Enter clinic name"
						/>
						{errors.clinicName && (
							<p className="text-red-500 text-xs mt-1">{errors.clinicName}</p>
						)}
					</div>

					<div>
						<Input
							label="Clinic Code *"
							value={formData.clinicCode}
							onChange={(e) =>
								setFormData({ ...formData, clinicCode: e.target.value })
							}
							placeholder="e.g., SMILE_D1"
							disabled={!!clinic}
						/>
						{errors.clinicCode && (
							<p className="text-red-500 text-xs mt-1">{errors.clinicCode}</p>
						)}
					</div>

					<div>
						<Input
							label="Phone"
							value={formData.phone}
							onChange={(e) =>
								setFormData({ ...formData, phone: e.target.value })
							}
							placeholder="Enter phone number"
						/>
					</div>

					<div>
						<Input
							label="Email"
							type="email"
							value={formData.email}
							onChange={(e) =>
								setFormData({ ...formData, email: e.target.value })
							}
							placeholder="clinic@example.com"
						/>
						{errors.email && (
							<p className="text-red-500 text-xs mt-1">{errors.email}</p>
						)}
					</div>

					<div className="md:col-span-2">
						<Input
							label="Website"
							value={formData.website}
							onChange={(e) =>
								setFormData({ ...formData, website: e.target.value })
							}
							placeholder="https://example.com"
						/>
					</div>
				</div>
			</div>

			{/* Address Information */}
			<div className="bg-white rounded-xl p-6 shadow-sm">
				<h3 className="text-lg font-bold mb-4 flex items-center gap-2">
					<Icon icon="mdi:map-marker" className="text-green-600" width={24} />
					Address Information
				</h3>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="md:col-span-2">
						<Input
							label="Address *"
							value={formData.address}
							onChange={(e) =>
								setFormData({ ...formData, address: e.target.value })
							}
							placeholder="Street address"
						/>
						{errors.address && (
							<p className="text-red-500 text-xs mt-1">{errors.address}</p>
						)}
					</div>

					<div>
						<Input
							label="Ward"
							value={formData.ward}
							onChange={(e) =>
								setFormData({ ...formData, ward: e.target.value })
							}
							placeholder="Ward name"
						/>
					</div>

					<div>
						<Input
							label="District"
							value={formData.district}
							onChange={(e) =>
								setFormData({ ...formData, district: e.target.value })
							}
							placeholder="District name"
						/>
					</div>

					<div className="md:col-span-2">
						<Input
							label="City"
							value={formData.city}
							onChange={(e) =>
								setFormData({ ...formData, city: e.target.value })
							}
							placeholder="City name"
						/>
					</div>
				</div>
			</div>

			{/* Operating Hours */}
			<div className="bg-white rounded-xl p-6 shadow-sm">
				<h3 className="text-lg font-bold mb-4 flex items-center gap-2">
					<Icon
						icon="mdi:clock-outline"
						className="text-purple-600"
						width={24}
					/>
					Operating Hours
				</h3>

				<div className="space-y-2">
					{DAYS_OF_WEEK.map((day) => (
						<div key={day} className="flex items-center gap-4">
							<label className="w-24 capitalize font-medium text-sm">
								{day}:
							</label>
							<Input
								label=""
								value={operatingHours[day] || ""}
								onChange={(e) =>
									setOperatingHours({
										...operatingHours,
										[day]: e.target.value,
									})
								}
								placeholder="08:00-17:00 or Closed"
							/>
						</div>
					))}
				</div>
			</div>

			{/* License Information */}
			<div className="bg-white rounded-xl p-6 shadow-sm">
				<h3 className="text-lg font-bold mb-4 flex items-center gap-2">
					<Icon icon="mdi:certificate" className="text-orange-600" width={24} />
					License Information
				</h3>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<Input
							label="License Number"
							value={formData.licenseNumber}
							onChange={(e) =>
								setFormData({ ...formData, licenseNumber: e.target.value })
							}
							placeholder="License number"
						/>
					</div>

					<div>
						<Input
							label="License Expiry"
							type="date"
							value={formData.licenseExpiry}
							onChange={(e) =>
								setFormData({ ...formData, licenseExpiry: e.target.value })
							}
						/>
					</div>

					{clinic && (
						<div>
							<label className="block text-sm font-medium mb-1">Status</label>
							<select
								className="w-full px-3 py-2 border rounded-md"
								value={formData.status}
								onChange={(e) =>
									setFormData({
										...formData,
										status: e.target.value as ClinicStatus,
									})
								}
							>
								{CLINIC_STATUS_OPTIONS.map((option) => (
									<option key={option.value} value={option.value}>
										{option.label}
									</option>
								))}
							</select>
						</div>
					)}
				</div>
			</div>

			{/* Actions */}
			<div className="flex gap-3 justify-end sticky bottom-0 bg-white p-4 rounded-xl shadow-lg border-t">
				<button
					onClick={onCancel}
					disabled={isSubmitting}
					className="px-6 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
				>
					Cancel
				</button>
				<button
					onClick={handleSubmit}
					disabled={isSubmitting}
					className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
				>
					{isSubmitting && <Icon icon="line-md:loading-twotone-loop" />}
					{clinic ? "Update Clinic" : "Create Clinic"}
				</button>
			</div>
		</div>
	);
};
