"use client";

import { Icon } from "@iconify/react";

import type { ServiceListParams } from "../types/service.type";

interface ServiceFiltersProps {
	filters: ServiceListParams;
	onFilterChange: (key: string, value: string | boolean | undefined) => void;
	onReset: () => void;
}

export function ServiceFilters({
	filters,
	onFilterChange,
	onReset,
}: ServiceFiltersProps) {
	return (
		<div className="rounded-lg border bg-white p-5 shadow-sm">
			<div className="mb-4 flex items-center justify-between">
				<h3 className="text-base font-semibold text-gray-900">Filters</h3>
				<button
					onClick={onReset}
					className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600"
				>
					<Icon icon="mdi:refresh" className="text-sm" />
					Reset
				</button>
			</div>

			<div className="space-y-4">
				{/* Search by name */}
				<div>
					<label className="mb-1 block text-xs font-medium text-gray-700">
						Service name
					</label>
					<div className="relative">
						<Icon
							icon="mdi:magnify"
							className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
						/>
						<input
							type="text"
							placeholder="Search..."
							value={(filters.service_name as string) ?? ""}
							onChange={(e) =>
								onFilterChange("service_name", e.target.value || undefined)
							}
							className="w-full rounded-lg border border-gray-200 py-2 pl-8 pr-3 text-sm focus:border-blue-400 focus:outline-none"
						/>
					</div>
				</div>

				{/* Active status */}
				<div>
					<label className="mb-1 block text-xs font-medium text-gray-700">
						Status
					</label>
					<select
						value={
							filters.isActive === undefined ? "" : String(filters.isActive)
						}
						onChange={(e) => {
							const val = e.target.value;
							onFilterChange(
								"isActive",
								val === "" ? undefined : val === "true",
							);
						}}
						className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
					>
						<option value="">All</option>
						<option value="true">Active</option>
						<option value="false">Inactive</option>
					</select>
				</div>

				{/* Page size */}
				<div>
					<label className="mb-1 block text-xs font-medium text-gray-700">
						Per page
					</label>
					<select
						value={filters.size ?? filters.limit ?? 12}
						onChange={(e) => onFilterChange("size", e.target.value)}
						className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
					>
						<option value={12}>12</option>
						<option value={24}>24</option>
						<option value={48}>48</option>
					</select>
				</div>
			</div>
		</div>
	);
}
