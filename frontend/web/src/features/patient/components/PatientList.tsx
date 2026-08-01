"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { Icon } from "@iconify/react";

import { genderLabel } from "@/shared/constants/common";
import { ROUTES } from "@/shared/constants/routes";

import { usePatient } from "../hooks/usePatient";
import type { Patient } from "../types/patient.type";

function getInitials(name: string): string {
	return name
		.split(" ")
		.filter(Boolean)
		.slice(0, 2)
		.map((w) => w[0].toUpperCase())
		.join("");
}

function calcAge(dob: string): number {
	const birth = new Date(dob);
	const now = new Date();
	let age = now.getFullYear() - birth.getFullYear();
	if (
		now.getMonth() < birth.getMonth() ||
		(now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())
	) {
		age--;
	}
	return age;
}

type TabId = "overview" | "records" | "history";

function PatientDetail({
	patient,
	router,
}: { patient: Patient; router: ReturnType<typeof useRouter> }) {
	const [tab, setTab] = useState<TabId>("overview");
	const { useMedicalHistory } = usePatient();
	const { data: historyData } = useMedicalHistory(patient.id);
	const conditions = historyData?.data ?? [];

	const genderText = genderLabel(patient.gender);
	const age = patient.dateOfBirth ? calcAge(patient.dateOfBirth) : null;
	const initials = getInitials(patient.fullName);

	const tabs: { id: TabId; label: string }[] = [
		{ id: "overview", label: "Overview" },
		{ id: "records", label: "Records" },
		{ id: "history", label: "History" },
	];

	return (
		<div className="flex flex-col h-full">
			{/* Patient Header */}
			<div className="p-5 border-b border-slate-100">
				<div className="flex items-start gap-4">
					<div className="w-[54px] h-[54px] rounded-full bg-gradient-to-br from-teal-400 to-teal-600 text-white font-bold flex items-center justify-center text-lg shadow-md flex-none ring-4 ring-teal-50">
						{initials}
					</div>
					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-2 flex-wrap">
							<h2 className="text-lg font-bold text-slate-900">
								{patient.fullName}
							</h2>
							{(patient.allergies?.length ?? 0) > 0 && (
								<span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
									<Icon icon="mdi:alert" width={11} />
									Allergies
								</span>
							)}
						</div>
						<p className="text-xs text-slate-400 mt-0.5">
							#{patient.patientCode} · {genderText}
							{age !== null ? ` · ${age}y` : ""}
						</p>
					</div>
				</div>

				{/* Action Buttons */}
				<div className="flex gap-2 mt-4">
					<button
						onClick={() => router.push(ROUTES.PATIENT_NEW)}
						className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] bg-gradient-to-br from-teal-400 to-teal-600 text-white font-semibold rounded-xl shadow-[0_8px_20px_-6px_rgba(14,140,128,0.55)] hover:brightness-105 hover:-translate-y-px transition-all text-sm"
					>
						<Icon icon="mdi:calendar-plus" width={16} />
						New visit
					</button>
					<button
						onClick={() => router.push(ROUTES.PATIENT_DETAIL(patient.id))}
						className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] bg-white font-semibold rounded-xl shadow-[4px_4px_10px_rgba(177,192,202,0.7),-4px_-4px_10px_rgba(255,255,255,1)] hover:-translate-y-px transition-all text-slate-700 text-sm"
					>
						<Icon icon="mdi:account-edit" width={16} />
						Edit profile
					</button>
				</div>
			</div>

			{/* Tabs */}
			<div className="px-5 pt-4 border-b border-slate-100">
				<div className="inline-flex p-1 gap-0.5 bg-slate-100 border border-slate-200 rounded-full shadow-[inset_0_1px_3px_rgba(0,0,0,0.08)]">
					{tabs.map((t) => (
						<button
							key={t.id}
							onClick={() => setTab(t.id)}
							className={
								tab === t.id
									? "px-4 min-h-[36px] rounded-full text-sm font-semibold bg-gradient-to-br from-teal-400 to-teal-600 text-white shadow-[0_4px_10px_-4px_rgba(14,140,128,0.55)] transition-all"
									: "px-4 min-h-[36px] rounded-full text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors"
							}
						>
							{t.label}
						</button>
					))}
				</div>
			</div>

			{/* Tab Content */}
			<div className="flex-1 overflow-y-auto p-5">
				{tab === "overview" && (
					<div className="grid grid-cols-2 gap-4">
						{/* Profile Info */}
						<div className="col-span-2 sm:col-span-1 bg-slate-50 rounded-xl p-4 border border-slate-100">
							<p className="text-xs font-semibold text-slate-400 uppercase tracking-widest font-mono mb-3">
								Profile
							</p>
							<div className="space-y-2">
								{[
									{ icon: "mdi:phone", label: patient.phone },
									patient.email
										? { icon: "mdi:email", label: patient.email }
										: null,
									patient.address
										? { icon: "mdi:map-marker", label: patient.address }
										: null,
									patient.insuranceNumber
										? {
												icon: "mdi:shield-check",
												label: `BHYT: ${patient.insuranceNumber}`,
											}
										: null,
								]
									.filter(Boolean)
									.map((item, i) => (
										<div
											key={i}
											className="flex items-center gap-2 text-xs text-slate-600"
										>
											<Icon
												icon={item!.icon}
												width={14}
												className="text-teal-600 flex-none"
											/>
											<span className="truncate">{item!.label}</span>
										</div>
									))}
							</div>
						</div>

						{/* Conditions */}
						<div className="col-span-2 sm:col-span-1 bg-slate-50 rounded-xl p-4 border border-slate-100">
							<p className="text-xs font-semibold text-slate-400 uppercase tracking-widest font-mono mb-3">
								Conditions
							</p>
							{conditions.length === 0 ? (
								<p className="text-xs text-slate-400">No conditions recorded</p>
							) : (
								<div className="flex flex-wrap gap-1.5">
									{conditions.map((c) => (
										<span
											key={c.id}
											className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-700"
										>
											{c.conditionName}
										</span>
									))}
								</div>
							)}

							{/* Allergies */}
							{(patient.allergies?.length ?? 0) > 0 && (
								<div className="mt-3">
									<p className="text-xs font-semibold text-red-500 mb-1.5">
										Allergies
									</p>
									<div className="flex flex-wrap gap-1.5">
										{patient.allergies!.map((a) => (
											<span
												key={a}
												className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700"
											>
												{a}
											</span>
										))}
									</div>
								</div>
							)}
						</div>
					</div>
				)}

				{tab === "records" && (
					<div className="flex flex-col items-center justify-center h-40 gap-3">
						<Icon
							icon="mdi:file-document-outline"
							width={40}
							className="text-slate-300"
						/>
						<p className="text-sm text-slate-500">View full medical records</p>
						<button
							onClick={() => router.push(ROUTES.PATIENT_DETAIL(patient.id))}
							className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] bg-gradient-to-br from-teal-400 to-teal-600 text-white font-semibold rounded-xl shadow-[0_8px_20px_-6px_rgba(14,140,128,0.55)] hover:brightness-105 hover:-translate-y-px transition-all text-sm"
						>
							<Icon icon="mdi:open-in-new" width={16} />
							Open patient page
						</button>
					</div>
				)}

				{tab === "history" && (
					<div className="flex flex-col items-center justify-center h-40 gap-3">
						<Icon icon="mdi:history" width={40} className="text-slate-300" />
						<p className="text-sm text-slate-500">View treatment history</p>
						<button
							onClick={() => router.push(ROUTES.PATIENT_DETAIL(patient.id))}
							className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] bg-gradient-to-br from-teal-400 to-teal-600 text-white font-semibold rounded-xl shadow-[0_8px_20px_-6px_rgba(14,140,128,0.55)] hover:brightness-105 hover:-translate-y-px transition-all text-sm"
						>
							<Icon icon="mdi:open-in-new" width={16} />
							Open patient page
						</button>
					</div>
				)}
			</div>
		</div>
	);
}

export function PatientList() {
	const router = useRouter();
	const [search, setSearch] = useState("");
	const [selectedId, setSelectedId] = useState<string | null>(null);

	const { usePatients, usePatientById } = usePatient();
	const { data, isLoading, error } = usePatients();
	const patients: Patient[] = data?.data ?? [];

	const { data: selectedData } = usePatientById(selectedId ?? "");
	const selectedPatient: Patient | undefined = selectedData?.data;

	const filtered = search.trim()
		? patients.filter(
				(p) =>
					p.fullName.toLowerCase().includes(search.toLowerCase()) ||
					p.patientCode.toLowerCase().includes(search.toLowerCase()) ||
					p.phone.includes(search),
			)
		: patients;

	return (
		<div className="flex h-full gap-5">
			{/* Patient List Panel */}
			<div className="w-[360px] shrink-0 bg-white rounded-2xl shadow-[6px_6px_14px_rgba(177,192,202,0.7),-6px_-6px_14px_rgba(255,255,255,1)] flex flex-col overflow-hidden">
				{/* Header */}
				<div className="p-5 border-b border-slate-100 space-y-3">
					<div className="flex items-center justify-between">
						<h2 className="text-lg font-bold text-slate-900">Patients</h2>
						<span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-700">
							{patients.length}
						</span>
					</div>
					{/* Search */}
					<div className="relative">
						<Icon
							icon="mdi:magnify"
							width={16}
							className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
						/>
						<input
							type="text"
							placeholder="Search name, code, phone..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="w-full min-h-[44px] pl-9 pr-4 bg-slate-100 border border-slate-200 rounded-xl shadow-[inset_0_1px_2px_rgba(0,0,0,0.08)] focus:outline-none focus:border-teal-500 focus:shadow-[inset_0_1px_2px_rgba(0,0,0,0.08),0_0_0_3px_rgba(14,140,128,0.2)] text-sm"
						/>
					</div>
				</div>

				{/* List */}
				<div className="flex-1 overflow-y-auto p-2">
					{isLoading && (
						<div className="space-y-2 p-2">
							{Array.from({ length: 5 }).map((_, i) => (
								<div
									key={i}
									className="rounded-xl p-3 animate-pulse bg-slate-50"
								>
									<div className="flex items-center gap-3">
										<div className="w-10 h-10 rounded-full bg-slate-200 flex-none" />
										<div className="flex-1 space-y-2">
											<div className="h-4 bg-slate-200 rounded w-2/3" />
											<div className="h-3 bg-slate-100 rounded w-1/2" />
										</div>
									</div>
								</div>
							))}
						</div>
					)}

					{error && (
						<div className="m-3 bg-red-50 border border-red-200 rounded-xl p-4 text-center">
							<Icon
								icon="mdi:alert-circle"
								width={32}
								className="text-red-400 mx-auto mb-1"
							/>
							<p className="text-red-700 text-sm">
								Failed to load patient list
							</p>
						</div>
					)}

					{!isLoading && !error && filtered.length === 0 && (
						<div className="flex flex-col items-center justify-center py-12 text-slate-400">
							<Icon
								icon="mdi:account-multiple-outline"
								width={40}
								className="mb-2 text-slate-300"
							/>
							<p className="text-sm">No patients found</p>
						</div>
					)}

					{!isLoading &&
						filtered.map((patient) => {
							const initials = getInitials(patient.fullName);
							const age = patient.dateOfBirth
								? calcAge(patient.dateOfBirth)
								: null;
							const isSelected = selectedId === patient.id;
							return (
								<button
									key={patient.id}
									onClick={() => setSelectedId(patient.id)}
									aria-selected={isSelected}
									className={`flex items-center gap-3 p-3 w-full rounded-xl transition-colors text-left ${
										isSelected ? "bg-teal-50" : "hover:bg-teal-50"
									}`}
								>
									<div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 text-white font-bold flex items-center justify-center text-sm shadow-md flex-none">
										{initials}
									</div>
									<div className="flex-1 min-w-0">
										<p className="font-bold text-slate-900 text-sm truncate">
											{patient.fullName}
										</p>
										<p className="text-xs text-slate-400">
											#{patient.patientCode} · {genderLabel(patient.gender)}
											{age !== null ? ` · ${age}y` : ""}
										</p>
									</div>
									{(patient.allergies?.length ?? 0) > 0 ? (
										<span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 flex-none">
											Allergy
										</span>
									) : (
										<span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 flex-none">
											Active
										</span>
									)}
								</button>
							);
						})}
				</div>
			</div>

			{/* Detail Panel */}
			<div className="flex-1 bg-white rounded-2xl shadow-[6px_6px_14px_rgba(177,192,202,0.7),-6px_-6px_14px_rgba(255,255,255,1)] overflow-hidden flex flex-col">
				{!selectedId || !selectedPatient ? (
					<div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4">
						<div className="w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center">
							<Icon
								icon="mdi:account-details"
								width={36}
								className="text-teal-400"
							/>
						</div>
						<div className="text-center">
							<p className="font-semibold text-slate-600">Select a patient</p>
							<p className="text-sm text-slate-400 mt-1">
								Click a name on the left to view details
							</p>
						</div>
					</div>
				) : (
					<PatientDetail patient={selectedPatient} router={router} />
				)}
			</div>
		</div>
	);
}
