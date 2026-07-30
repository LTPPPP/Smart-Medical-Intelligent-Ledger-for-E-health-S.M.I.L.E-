"use client";

import { useMemo } from "react";

import Link from "next/link";

import { Icon } from "@iconify/react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

import { useAuthStore } from "@/features/auth/store/authStore";
import { useRevenue } from "@/features/revenue/hooks/useRevenue";
import type { RevenueReport } from "@/features/revenue/types/revenue.type";
import { ROUTES } from "@/shared/constants/routes";

import {
	DashboardHeader,
	DashStat,
	DashPanel,
	DashEmpty,
} from "./DashboardPrimitives";

const toISODate = (d: Date) => d.toISOString().split("T")[0];
const defaultRange = () => {
	const to = new Date();
	const from = new Date();
	from.setDate(from.getDate() - 30);
	return { from: toISODate(from), to: toISODate(to) };
};
const formatCurrency = (value: number, currency = "VND") => {
	try {
		return new Intl.NumberFormat("vi-VN", {
			style: "currency",
			currency,
			maximumFractionDigits: 0,
		}).format(value);
	} catch {
		return `${value.toLocaleString("vi-VN")} ${currency}`;
	}
};

export function AdminDashboard() {
	const { user } = useAuthStore();
	const range = useMemo(defaultRange, []);
	const { data, isLoading } = useRevenue({
		date_from: range.from,
		date_to: range.to,
	});
	const report: RevenueReport | undefined = data?.data;
	const currency = report?.totals.currency ?? "VND";

	const topServices = (report?.by_service ?? []).slice(0, 5);
	const byDayChart = useMemo(
		() =>
			(report?.by_day ?? []).map((d) => ({
				date: d.date.slice(5),
				revenue: d.revenue,
			})),
		[report],
	);

	return (
		<div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-8 sm:py-10">
			<DashboardHeader
				eyebrow="Administration"
				title={`Welcome back, ${user?.fullName ?? "Admin"}`}
				subtitle="System overview — revenue, operations, and management."
				icon="lucide:shield-check"
				right={
					<Link
						href={ROUTES.ADMIN}
						className="flex items-center gap-2 rounded-full border px-4 py-2 font-inter text-sm font-semibold text-smile-title transition hover:border-smile-primary/40"
						style={{
							background: "var(--surface-card-bg)",
							borderColor: "var(--surface-card-border)",
						}}
					>
						<Icon icon="lucide:layout-grid" width={16} /> Admin Panel
					</Link>
				}
			/>

			<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
				<DashStat
					label="Revenue (30d)"
					value={
						report ? formatCurrency(report.totals.total_revenue, currency) : "—"
					}
					icon="lucide:wallet"
					loading={isLoading}
					accent
				/>
				<DashStat
					label="Paid Appointments"
					value={report ? String(report.totals.paid_count) : "—"}
					icon="lucide:badge-check"
					loading={isLoading}
				/>
				<DashStat
					label="Services Tracked"
					value={report ? String(report.by_service.length) : "—"}
					icon="lucide:stethoscope"
					loading={isLoading}
				/>
				<DashStat
					label="Currency"
					value={currency}
					icon="lucide:coins"
					loading={isLoading}
				/>
			</div>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				<DashPanel
					title="Top Services by Revenue (30d)"
					icon="lucide:trending-up"
				>
					{topServices.length === 0 ? (
						<DashEmpty label="No revenue data yet" />
					) : (
						<ul
							className="divide-y"
							style={{ borderColor: "var(--surface-panel-border)" }}
						>
							{topServices.map((s) => (
								<li
									key={s.service_id ?? s.service_name}
									className="flex items-center justify-between gap-4 px-6 py-3.5"
								>
									<div className="min-w-0">
										<p className="truncate font-inter text-sm font-medium text-smile-title">
											{s.service_name}
										</p>
										<p className="font-inter text-xs text-smile-description">
											{s.count} paid
										</p>
									</div>
									<span className="shrink-0 font-poppins text-sm font-semibold text-smile-primary">
										{formatCurrency(s.revenue, currency)}
									</span>
								</li>
							))}
						</ul>
					)}
				</DashPanel>

				<DashPanel title="Revenue Trend (30d)" icon="lucide:line-chart">
					{isLoading ? (
						<div className="flex h-[220px] items-center justify-center">
							<Icon
								icon="line-md:loading-twotone-loop"
								width={22}
								className="text-smile-primary"
							/>
						</div>
					) : byDayChart.length === 0 ? (
						<DashEmpty label="No revenue data yet" />
					) : (
						<ResponsiveContainer width="100%" height={220}>
							<BarChart
								data={byDayChart}
								margin={{ top: 8, right: 12, left: -10, bottom: 0 }}
							>
								<CartesianGrid
									strokeDasharray="3 3"
									stroke="rgba(100,116,139,0.15)"
								/>
								<XAxis
									dataKey="date"
									tick={{ fontSize: 11, fill: "var(--color-smile-description)" }}
								/>
								<YAxis
									tick={{ fontSize: 11, fill: "var(--color-smile-description)" }}
									tickFormatter={(v: number) =>
										Intl.NumberFormat("en-US", { notation: "compact" }).format(v)
									}
								/>
								<Tooltip
									contentStyle={{
										borderRadius: 12,
										fontSize: 12,
										border: "1px solid rgba(100,116,139,0.2)",
										background: "var(--surface-card-bg)",
									}}
									formatter={(value) => [
										formatCurrency(Number(value ?? 0), currency),
										"Revenue",
									]}
								/>
								<Bar dataKey="revenue" fill="#10b981" radius={[6, 6, 0, 0]} />
							</BarChart>
						</ResponsiveContainer>
					)}
				</DashPanel>
			</div>
		</div>
	);
}
