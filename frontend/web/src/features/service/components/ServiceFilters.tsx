"use client";

import { Icon } from "@iconify/react";

import { cardBase } from "@/features/reports/components/ReportPrimitives";

import type { ServiceListParams } from "../types/service.type";

interface ServiceFiltersProps {
	filters: ServiceListParams;
	onFilterChange: (
		key: string,
		value: string | number | boolean | undefined,
	) => void;
	onReset: () => void;
}

export function ServiceFilters({
	filters,
	onFilterChange,
	onReset,
}: ServiceFiltersProps) {
	return (
		<section className={`${cardBase} p-5`}>
			<div className="mb-4 flex items-center justify-between">
				<h2 className="font-poppins text-base font-semibold text-smile-title">
					Filters
				</h2>
				<button
					type="button"
					onClick={onReset}
					className="inline-flex min-h-9 items-center gap-1 text-sm font-semibold text-smile-description transition hover:text-smile-primary"
				>
					<Icon icon="mdi:refresh" width={16} />
					Reset
				</button>
			</div>

			<div className="space-y-4">
				<div>
					<label
						htmlFor="service-name-filter"
						className="mb-1.5 block text-sm font-semibold text-smile-title"
					>
						Service name
					</label>
					<div className="relative">
						<Icon
							icon="mdi:magnify"
							width={17}
							className="absolute left-3 top-1/2 -translate-y-1/2 text-smile-description"
						/>
						<input
							id="service-name-filter"
							type="text"
							placeholder="Search services"
							value={(filters.service_name as string) ?? ""}
							onChange={(e) =>
								onFilterChange("service_name", e.target.value || undefined)
							}
							className="h-11 w-full rounded-xl border py-2 pl-10 pr-3 text-sm text-smile-title outline-none transition focus:border-smile-primary [border-color:var(--surface-input-border)] [background:var(--surface-input-bg)]"
						/>
					</div>
				</div>

				<div>
					<label
						htmlFor="service-status-filter"
						className="mb-1.5 block text-sm font-semibold text-smile-title"
					>
						Status
					</label>
					<select
						id="service-status-filter"
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
						className="h-11 w-full rounded-xl border px-3 text-sm text-smile-title outline-none transition focus:border-smile-primary [border-color:var(--surface-input-border)] [background:var(--surface-input-bg)]"
					>
						<option value="">All statuses</option>
						<option value="true">Active</option>
						<option value="false">Inactive</option>
					</select>
				</div>

				<div>
					<label
						htmlFor="service-page-size"
						className="mb-1.5 block text-sm font-semibold text-smile-title"
					>
						Per page
					</label>
					<select
						id="service-page-size"
						value={filters.size ?? filters.limit ?? 12}
						onChange={(e) => onFilterChange("size", Number(e.target.value))}
						className="h-11 w-full rounded-xl border px-3 text-sm text-smile-title outline-none transition focus:border-smile-primary [border-color:var(--surface-input-border)] [background:var(--surface-input-bg)]"
					>
						<option value={12}>12</option>
						<option value={24}>24</option>
						<option value={48}>48</option>
					</select>
				</div>
			</div>
		</section>
	);
}
