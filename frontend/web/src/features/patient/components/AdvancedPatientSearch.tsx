"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { Icon } from "@iconify/react";

import { GENDER_OPTIONS } from "@/shared/constants/common";
import { ROUTES } from "@/shared/constants/routes";

import { usePatient } from "../hooks/usePatient";
import type { Patient } from "../types/patient.type";

interface SearchFilters {
	name: string;
	code: string;
	phone: string;
	gender: string;
}

export function AdvancedPatientSearch() {
	const router = useRouter();
	const { usePatients } = usePatient();
	const { data } = usePatients();
	const allPatients: Patient[] = data?.data ?? [];

	const [filters, setFilters] = useState<SearchFilters>({
		name: "",
		code: "",
		phone: "",
		gender: "",
	});
	const [searched, setSearched] = useState(false);
	const [results, setResults] = useState<Patient[]>([]);

	const handleSearch = () => {
		const filtered = allPatients.filter((p) => {
			if (
				filters.name &&
				!p.fullName.toLowerCase().includes(filters.name.toLowerCase())
			)
				return false;
			if (
				filters.code &&
				!p.patientCode.toLowerCase().includes(filters.code.toLowerCase())
			)
				return false;
			if (filters.phone && !p.phone.includes(filters.phone)) return false;
			if (filters.gender && p.gender !== Number(filters.gender)) return false;
			return true;
		});
		setResults(filtered);
		setSearched(true);
	};

	const handleReset = () => {
		setFilters({ name: "", code: "", phone: "", gender: "" });
		setSearched(false);
		setResults([]);
	};

	return (
		<div className="space-y-6">
			<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
				<h3 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2">
					<Icon icon="mdi:filter" width={22} className="text-blue-600" />
					Search Filters
				</h3>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
					<div>
						<label className="block text-sm text-gray-600 mb-1">
							Full Name
						</label>
						<input
							type="text"
							placeholder="Enter patient name..."
							value={filters.name}
							onChange={(e) =>
								setFilters((f) => ({ ...f, name: e.target.value }))
							}
							className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
						/>
					</div>
					<div>
						<label className="block text-sm text-gray-600 mb-1">
							Patient Code
						</label>
						<input
							type="text"
							placeholder="Enter patient code..."
							value={filters.code}
							onChange={(e) =>
								setFilters((f) => ({ ...f, code: e.target.value }))
							}
							className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
						/>
					</div>
					<div>
						<label className="block text-sm text-gray-600 mb-1">
							Phone Number
						</label>
						<input
							type="text"
							placeholder="Enter phone number..."
							value={filters.phone}
							onChange={(e) =>
								setFilters((f) => ({ ...f, phone: e.target.value }))
							}
							className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
						/>
					</div>
					<div>
						<label className="block text-sm text-gray-600 mb-1">Gender</label>
						<select
							value={filters.gender}
							onChange={(e) =>
								setFilters((f) => ({ ...f, gender: e.target.value }))
							}
							className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
						>
							<option value="">All</option>
							{GENDER_OPTIONS.map((o) => (
								<option key={o.value} value={o.value}>
									{o.label}
								</option>
							))}
						</select>
					</div>
				</div>

				<div className="flex gap-3">
					<button
						onClick={handleSearch}
						className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
					>
						<Icon icon="mdi:magnify" width={18} />
						Search
					</button>
					<button
						onClick={handleReset}
						className="px-6 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
					>
						<Icon icon="mdi:refresh" width={18} />
						Reset
					</button>
				</div>
			</div>

			{searched && (
				<div>
					<p className="text-sm text-gray-500 mb-3">
						Found {results.length} patients
					</p>
					{results.length === 0 ? (
						<div className="bg-white rounded-xl shadow-sm p-12 text-center">
							<Icon
								icon="mdi:account-search-outline"
								width={48}
								className="text-gray-300 mx-auto mb-3"
							/>
							<p className="text-gray-500">No matching patients found</p>
						</div>
					) : (
						<div className="space-y-3">
							{results.map((patient) => (
								<button
									key={patient.id}
									onClick={() => router.push(ROUTES.PATIENT_DETAIL(patient.id))}
									className="w-full text-left bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md hover:border-blue-200 transition-all"
								>
									<div className="flex items-center justify-between">
										<div>
											<p className="font-semibold text-gray-800">
												{patient.fullName}
											</p>
											<div className="flex items-center gap-3 text-sm text-gray-500 mt-0.5">
												<span>Code: {patient.patientCode}</span>
												<span>•</span>
												<span>{patient.phone}</span>
											</div>
										</div>
										<Icon
											icon="mdi:chevron-right"
											width={20}
											className="text-gray-400"
										/>
									</div>
								</button>
							))}
						</div>
					)}
				</div>
			)}
		</div>
	);
}
