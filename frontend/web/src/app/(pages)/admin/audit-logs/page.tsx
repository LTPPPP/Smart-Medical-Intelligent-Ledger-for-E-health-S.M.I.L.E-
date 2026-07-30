"use client";

import { Fragment, useEffect, useState } from "react";

import { Icon } from "@iconify/react";
import { AnimatePresence, motion } from "framer-motion";

import {
	fadeUpVariants,
	expandVariants,
	rowVariants,
} from "@/features/admin/animations/variants";
import {
	AUDIT_ACTION_OPTIONS,
	AUDIT_RESOURCE_OPTIONS,
	getAuditActionDotColor,
	getAuditActionMeta,
	getAuditResourceLabel,
} from "@/features/admin/constants/audit.constants";
import { useAdmin } from "@/features/admin/hooks/useAdmin";
import type { AuditLog } from "@/features/admin/types/admin.type";
import {
	formatDateTime,
	formatRelativeTime,
} from "@/features/admin/utils/date.utils";
import { useTranslation } from "@/features/i18n";

const LIMIT = 15;
const UUID_RE =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function summarizeUserAgent(
	ua: string | null,
	t: (key: string, fallback?: string) => string,
): string {
	if (!ua) return t("admin.auditLogs.unknownDevice", "Unknown device");
	const browser = /edg\//i.test(ua)
		? "Edge"
		: /chrome\//i.test(ua)
			? "Chrome"
			: /firefox\//i.test(ua)
				? "Firefox"
				: /safari\//i.test(ua)
					? "Safari"
					: t("admin.auditLogs.unknownBrowser", "Unknown browser");
	const os = /windows/i.test(ua)
		? "Windows"
		: /mac os/i.test(ua)
			? "macOS"
			: /android/i.test(ua)
				? "Android"
				: /iphone|ipad/i.test(ua)
					? "iOS"
					: /linux/i.test(ua)
						? "Linux"
						: t("admin.auditLogs.unknownOs", "Unknown OS");
	return `${browser} ${t("admin.auditLogs.on", "on")} ${os}`;
}

function AuditLogDetailPanel({ log }: { log: AuditLog }) {
	const { t } = useTranslation();
	return (
		<div className="space-y-3 py-3">
			<div className="grid gap-3 sm:grid-cols-2">
				<div>
					<p className="font-inter text-[10px] font-semibold uppercase tracking-wider text-smile-description">
						{t("admin.auditLogs.resourceId", "Resource ID")}
					</p>
					<p className="truncate font-mono text-xs text-smile-title">
						{log.resource_id ?? "—"}
					</p>
				</div>
				<div>
					<p className="font-inter text-[10px] font-semibold uppercase tracking-wider text-smile-description">
						{t("admin.auditLogs.device", "Device")}
					</p>
					<p
						className="font-inter text-xs text-smile-title"
						title={log.user_agent ?? undefined}
					>
						{summarizeUserAgent(log.user_agent, t)}
					</p>
				</div>
			</div>
			{log.details != null && (
				<div>
					<p className="mb-1 font-inter text-[10px] font-semibold uppercase tracking-wider text-smile-description">
						{t("admin.auditLogs.details", "Details")}
					</p>
					<pre className="overflow-x-auto rounded-lg bg-black/5 p-3 font-mono text-[11px] leading-relaxed text-smile-title dark:bg-white/5">
						{JSON.stringify(log.details, null, 2)}
					</pre>
				</div>
			)}
		</div>
	);
}

export default function AdminAuditLogsPage() {
	const { t } = useTranslation();
	const { useAuditLogs } = useAdmin();

	const [page, setPage] = useState(1);
	const [searchInput, setSearchInput] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [actionFilter, setActionFilter] = useState("");
	const [resourceFilter, setResourceFilter] = useState("");
	const [fromDate, setFromDate] = useState("");
	const [toDate, setToDate] = useState("");
	const [expandedId, setExpandedId] = useState<string | null>(null);

	useEffect(() => {
		const t = setTimeout(() => {
			setDebouncedSearch(searchInput);
			setPage(1);
		}, 400);
		return () => clearTimeout(t);
	}, [searchInput]);

	const trimmedSearch = debouncedSearch.trim();
	const searchIsUserId = UUID_RE.test(trimmedSearch);

	const { data, isLoading, isError, refetch } = useAuditLogs({
		page,
		limit: LIMIT,
		user_id: searchIsUserId ? trimmedSearch : undefined,
		action: actionFilter || undefined,
		resource: resourceFilter || undefined,
		from_date: fromDate || undefined,
		to_date: toDate || undefined,
	});

	const rawLogs = data?.data ?? [];
	const logs =
		!searchIsUserId && trimmedSearch
			? rawLogs.filter((l) =>
					(l.full_name ?? "")
						.toLowerCase()
						.includes(trimmedSearch.toLowerCase()),
				)
			: rawLogs;
	const total = data?.meta?.total ?? 0;
	const totalPages = Math.max(1, Math.ceil(total / LIMIT));

	const hasActiveFilters = Boolean(
		searchInput || actionFilter || resourceFilter || fromDate || toDate,
	);
	const resetFilters = () => {
		setSearchInput("");
		setActionFilter("");
		setResourceFilter("");
		setFromDate("");
		setToDate("");
		setPage(1);
	};

	const toggleExpand = (id: string) =>
		setExpandedId((prev) => (prev === id ? null : id));

	const pageNums = (): number[] => {
		if (totalPages <= 5)
			return Array.from({ length: totalPages }, (_, i) => i + 1);
		const start = Math.max(1, Math.min(page - 2, totalPages - 4));
		return Array.from({ length: 5 }, (_, i) => start + i);
	};

	const glassCard = {
		background: "var(--surface-card-bg)",
		borderColor: "var(--surface-card-border)",
		boxShadow: "var(--surface-card-shadow)",
	};
	const glassPanel = {
		background: "var(--surface-panel-bg)",
		borderColor: "var(--surface-panel-border)",
		boxShadow: "var(--surface-panel-shadow)",
	};
	const inputStyle = {
		background: "var(--surface-input-bg)",
		borderColor: "var(--surface-input-border)",
	};

	return (
		<div className="space-y-5">
			{/* Header */}
			<motion.div
				variants={fadeUpVariants}
				initial="hidden"
				animate="visible"
				custom={0}
			>
				<div
					className="relative overflow-hidden rounded-[24px] border backdrop-blur-xl"
					style={glassPanel}
				>
					<div className="absolute inset-x-0 top-0 h-[2.5px] rounded-t-[24px] bg-gradient-to-r from-slate-500 via-indigo-500 to-sky-500" />
					<div
						className="pointer-events-none absolute inset-0 rounded-[24px]"
						style={{
							background:
								"linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 50%)",
						}}
					/>
					<div className="relative flex flex-wrap items-center justify-between gap-3 px-6 py-5">
						<div className="flex items-center gap-3">
							<div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-500 to-indigo-500 shadow-[0_4px_12px_rgba(99,102,241,0.35)]">
								<Icon
									icon="lucide:scroll-text"
									width={20}
									className="text-white"
								/>
							</div>
							<div>
								<h1 className="font-poppins text-xl font-semibold text-smile-primary-dark">
									{t("admin.auditLogs.title", "Access Audit Log")}
								</h1>
								<p className="font-inter text-xs text-smile-description">
									{total > 0 ? (
										<>
											<span className="font-semibold text-indigo-600">
												{total}
											</span>{" "}
											{t("admin.auditLogs.eventsRecorded", "events recorded")}
										</>
									) : (
										t(
											"admin.auditLogs.systemActivityHistory",
											"System activity history",
										)
									)}
								</p>
							</div>
						</div>
						<button
							type="button"
							onClick={() => refetch()}
							className="flex items-center gap-2 rounded-xl border border-indigo-500/25 bg-indigo-500/5 px-4 py-2 font-inter text-sm font-semibold text-indigo-600 backdrop-blur-sm transition-all hover:bg-indigo-500 hover:text-white"
						>
							<Icon icon="lucide:refresh-cw" width={14} />
							{t("admin.auditLogs.refresh", "Refresh")}
						</button>
					</div>
				</div>
			</motion.div>

			{/* Filters */}
			<motion.div
				variants={fadeUpVariants}
				initial="hidden"
				animate="visible"
				custom={1}
			>
				<div
					className="relative overflow-hidden rounded-[22px] border backdrop-blur-xl"
					style={glassCard}
				>
					<div
						className="pointer-events-none absolute inset-0 rounded-[22px]"
						style={{
							background:
								"linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0) 50%)",
						}}
					/>
					<div className="relative space-y-3 p-5">
						<p className="font-inter text-[10px] font-bold uppercase tracking-[2.5px] text-smile-description">
							{t("admin.auditLogs.searchFilter", "Search & Filter")}
						</p>
						<div className="flex flex-wrap gap-3">
							<div className="relative min-w-[220px] flex-1">
								<Icon
									icon="lucide:search"
									width={13}
									className="absolute left-3 top-1/2 -translate-y-1/2 text-smile-description"
								/>
								<input
									type="text"
									placeholder={t(
										"admin.auditLogs.searchPlaceholder",
										"Search by name, or paste a user ID…",
									)}
									value={searchInput}
									onChange={(e) => setSearchInput(e.target.value)}
									className="w-full rounded-xl border py-2.5 pl-8 pr-8 font-inter text-sm text-smile-title placeholder:text-smile-description/60 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
									style={inputStyle}
								/>
								{searchInput && (
									<button
										type="button"
										onClick={() => setSearchInput("")}
										className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-smile-description/60 transition-colors hover:text-indigo-600"
									>
										<Icon icon="lucide:x" width={12} />
									</button>
								)}
							</div>

							<select
								value={actionFilter}
								onChange={(e) => {
									setActionFilter(e.target.value);
									setPage(1);
								}}
								className="cursor-pointer appearance-none rounded-xl border py-2.5 pl-3 pr-8 font-inter text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
								style={
									actionFilter
										? {
												background: "#6366F1",
												borderColor: "#6366F1",
												color: "#fff",
											}
										: inputStyle
								}
							>
								<option
									value=""
									style={{ background: "#fff", color: "#1a1a1a" }}
								>
									{t("admin.auditLogs.allActions", "All actions")}
								</option>
								{AUDIT_ACTION_OPTIONS.map((opt) => (
									<option
										key={opt.value}
										value={opt.value}
										style={{ background: "#fff", color: "#1a1a1a" }}
									>
										{opt.label}
									</option>
								))}
							</select>

							<select
								value={resourceFilter}
								onChange={(e) => {
									setResourceFilter(e.target.value);
									setPage(1);
								}}
								className="cursor-pointer appearance-none rounded-xl border py-2.5 pl-3 pr-8 font-inter text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
								style={
									resourceFilter
										? {
												background: "#6366F1",
												borderColor: "#6366F1",
												color: "#fff",
											}
										: inputStyle
								}
							>
								<option
									value=""
									style={{ background: "#fff", color: "#1a1a1a" }}
								>
									{t("admin.auditLogs.allResources", "All resources")}
								</option>
								{AUDIT_RESOURCE_OPTIONS.map((opt) => (
									<option
										key={opt.value}
										value={opt.value}
										style={{ background: "#fff", color: "#1a1a1a" }}
									>
										{opt.label}
									</option>
								))}
							</select>

							<input
								type="date"
								value={fromDate}
								onChange={(e) => {
									setFromDate(e.target.value);
									setPage(1);
								}}
								className="rounded-xl border py-2.5 px-3 font-inter text-sm text-smile-title transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400/30 [color-scheme:light] dark:[color-scheme:dark]"
								style={inputStyle}
							/>
							<input
								type="date"
								value={toDate}
								onChange={(e) => {
									setToDate(e.target.value);
									setPage(1);
								}}
								className="rounded-xl border py-2.5 px-3 font-inter text-sm text-smile-title transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400/30 [color-scheme:light] dark:[color-scheme:dark]"
								style={inputStyle}
							/>

							{hasActiveFilters && (
								<button
									type="button"
									onClick={resetFilters}
									className="flex items-center gap-1.5 rounded-xl border px-3 py-2.5 font-inter text-xs font-semibold text-smile-description transition-all hover:text-indigo-600"
									style={inputStyle}
								>
									<Icon icon="lucide:rotate-ccw" width={12} />
									{t("common.reset", "Reset")}
								</button>
							)}
						</div>
						<p className="font-inter text-[11px] text-smile-description/70">
							<Icon icon="lucide:info" width={11} className="mr-1 inline" />
							{t(
								"admin.auditLogs.searchHint",
								"Paste a full user ID for an exact match, or type a name to filter the current page.",
							)}
						</p>
					</div>
				</div>
			</motion.div>

			{/* Table (desktop) / Timeline (mobile) */}
			<motion.div
				variants={fadeUpVariants}
				initial="hidden"
				animate="visible"
				custom={2}
			>
				<div
					className="relative overflow-hidden rounded-[22px] border backdrop-blur-xl"
					style={glassCard}
				>
					<div
						className="pointer-events-none absolute inset-0 rounded-[22px]"
						style={{
							background:
								"linear-gradient(135deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0) 50%)",
						}}
					/>

					{isLoading ? (
						<div className="flex flex-col items-center justify-center gap-3 py-24">
							<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10">
								<Icon
									icon="line-md:loading-twotone-loop"
									width={28}
									className="text-indigo-500"
								/>
							</div>
							<p className="font-inter text-sm text-smile-description">
								{t("admin.auditLogs.loadingAuditLog", "Loading audit log…")}
							</p>
						</div>
					) : isError ? (
						<div className="flex flex-col items-center justify-center gap-3 py-24">
							<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-950/40">
								<Icon
									icon="lucide:wifi-off"
									width={24}
									className="text-red-500"
								/>
							</div>
							<p className="font-inter text-sm font-medium text-smile-title">
								{t("admin.auditLogs.failedToLoad", "Failed to load audit log")}
							</p>
							<button
								type="button"
								onClick={() => refetch()}
								className="rounded-xl bg-indigo-500 px-4 py-2 font-inter text-xs font-semibold text-white transition-all hover:bg-indigo-600"
							>
								{t("common.retry", "Retry")}
							</button>
						</div>
					) : logs.length === 0 ? (
						<div className="flex flex-col items-center justify-center gap-3 py-24">
							<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/5">
								<Icon
									icon="lucide:inbox"
									width={24}
									className="text-smile-description/40"
								/>
							</div>
							<p className="font-inter text-sm text-smile-description">
								{hasActiveFilters
									? t(
											"admin.auditLogs.noEventsFiltered",
											"No events match these filters",
										)
									: t(
											"admin.auditLogs.noEventsYet",
											"No events recorded yet",
										)}
							</p>
						</div>
					) : (
						<>
							{/* Desktop table */}
							<div className="relative hidden overflow-x-auto sm:block">
								<table className="w-full min-w-[760px]">
									<thead>
										<tr
											className="border-b"
											style={{
												borderColor: "var(--surface-panel-border)",
												background: "rgba(99,102,241,0.05)",
											}}
										>
											<th className="w-10 px-3 py-3.5" />
											<th className="whitespace-nowrap px-4 py-3.5 text-left font-inter text-[10px] font-bold uppercase tracking-[2px] text-indigo-600/70">
												Actor
											</th>
											<th className="whitespace-nowrap px-4 py-3.5 text-left font-inter text-[10px] font-bold uppercase tracking-[2px] text-indigo-600/70">
												Action
											</th>
											<th className="whitespace-nowrap px-4 py-3.5 text-left font-inter text-[10px] font-bold uppercase tracking-[2px] text-indigo-600/70">
												Resource
											</th>
											<th className="whitespace-nowrap px-4 py-3.5 text-left font-inter text-[10px] font-bold uppercase tracking-[2px] text-indigo-600/70">
												IP Address
											</th>
											<th className="whitespace-nowrap px-4 py-3.5 text-left font-inter text-[10px] font-bold uppercase tracking-[2px] text-indigo-600/70">
												Time
											</th>
										</tr>
									</thead>
									<tbody>
										{logs.map((log, i) => {
											const isExpanded = expandedId === log.log_id;
											const actionMeta = getAuditActionMeta(log.action);
											return (
												<Fragment key={log.log_id}>
													<motion.tr
														custom={i}
														variants={rowVariants}
														initial="hidden"
														animate="visible"
														className="group border-b last:border-b-0 transition-colors hover:bg-indigo-500/[0.04]"
														style={{
															borderColor: "var(--surface-panel-border)",
														}}
													>
														<td className="px-3 py-3.5">
															<button
																type="button"
																onClick={() => toggleExpand(log.log_id)}
																className="flex h-6 w-6 items-center justify-center rounded-md text-smile-description transition-all hover:bg-indigo-100 hover:text-indigo-600 dark:hover:bg-indigo-900/30"
																title={
																	isExpanded
																		? "Collapse details"
																		: "Expand details"
																}
															>
																<motion.div
																	animate={{ rotate: isExpanded ? 90 : 0 }}
																	transition={{ duration: 0.2 }}
																>
																	<Icon
																		icon="lucide:chevron-right"
																		width={14}
																	/>
																</motion.div>
															</button>
														</td>
														<td className="px-4 py-3.5">
															<div className="flex items-center gap-2.5">
																<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 font-inter text-xs font-bold text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300">
																	{log.full_name ? (
																		log.full_name.charAt(0).toUpperCase()
																	) : (
																		<Icon icon="lucide:cog" width={13} />
																	)}
																</div>
																<div className="min-w-0">
																	<p className="truncate font-inter text-sm font-semibold text-smile-primary-dark">
																		{log.full_name ?? "System"}
																	</p>
																	{log.user_id && (
																		<p className="truncate font-mono text-[10px] text-smile-description">
																			{log.user_id}
																		</p>
																	)}
																</div>
															</div>
														</td>
														<td className="px-4 py-3.5">
															<span
																className={`inline-flex items-center rounded-full px-2.5 py-1 font-inter text-xs font-semibold ${actionMeta.className}`}
															>
																{actionMeta.label}
															</span>
														</td>
														<td className="px-4 py-3.5">
															<span className="font-inter text-sm text-smile-description">
																{getAuditResourceLabel(log.resource)}
															</span>
														</td>
														<td className="px-4 py-3.5">
															<span className="font-mono text-xs text-smile-description">
																{log.ip_address ?? "—"}
															</span>
														</td>
														<td className="px-4 py-3.5">
															<span
																className="whitespace-nowrap font-inter text-xs text-smile-description"
																title={formatDateTime(log.created_at)}
															>
																{formatRelativeTime(log.created_at)}
															</span>
														</td>
													</motion.tr>
													<AnimatePresence>
														{isExpanded && (
															<tr
																className="border-b"
																style={{
																	borderColor: "var(--surface-panel-border)",
																}}
															>
																<td
																	colSpan={6}
																	className="p-0"
																	style={{
																		background: "var(--surface-input-bg)",
																	}}
																>
																	<motion.div
																		variants={expandVariants}
																		initial="hidden"
																		animate="visible"
																		exit="exit"
																		style={{ overflow: "hidden" }}
																	>
																		<div className="ml-3 border-l-2 border-indigo-400 px-4">
																			<AuditLogDetailPanel log={log} />
																		</div>
																	</motion.div>
																</td>
															</tr>
														)}
													</AnimatePresence>
												</Fragment>
											);
										})}
									</tbody>
								</table>
							</div>

							{/* Mobile timeline */}
							<div className="sm:hidden">
								{logs.map((log, i) => {
									const actionMeta = getAuditActionMeta(log.action);
									const isExpanded = expandedId === log.log_id;
									return (
										<motion.div
											key={log.log_id}
											custom={i}
											variants={rowVariants}
											initial="hidden"
											animate="visible"
											className="flex gap-3 border-b px-4 py-3.5 last:border-b-0"
											style={{ borderColor: "var(--surface-panel-border)" }}
										>
											<div className="flex flex-col items-center pt-1.5">
												<span
													className={`h-2.5 w-2.5 shrink-0 rounded-full ${getAuditActionDotColor(log.action)}`}
												/>
												{i < logs.length - 1 && (
													<span
														className="mt-1 w-px flex-1"
														style={{
															background: "var(--surface-panel-border)",
														}}
													/>
												)}
											</div>
											<div className="min-w-0 flex-1 space-y-1">
												<div className="flex items-center justify-between gap-2">
													<span
														className={`inline-flex items-center rounded-full px-2 py-0.5 font-inter text-[11px] font-semibold ${actionMeta.className}`}
													>
														{actionMeta.label}
													</span>
													<span className="shrink-0 font-inter text-[11px] text-smile-description">
														{formatRelativeTime(log.created_at)}
													</span>
												</div>
												<p className="truncate font-inter text-sm font-medium text-smile-title">
													{log.full_name ?? "System"}
												</p>
												<p className="font-inter text-[11px] text-smile-description">
													{getAuditResourceLabel(log.resource)}
													{log.ip_address ? ` · ${log.ip_address}` : ""}
												</p>
												<button
													type="button"
													onClick={() => toggleExpand(log.log_id)}
													className="font-inter text-[11px] font-semibold text-indigo-600"
												>
													{isExpanded ? "Hide details" : "View details"}
												</button>
												<AnimatePresence>
													{isExpanded && (
														<motion.div
															variants={expandVariants}
															initial="hidden"
															animate="visible"
															exit="exit"
															style={{ overflow: "hidden" }}
														>
															<AuditLogDetailPanel log={log} />
														</motion.div>
													)}
												</AnimatePresence>
											</div>
										</motion.div>
									);
								})}
							</div>
						</>
					)}

					{!isLoading && !isError && logs.length > 0 && (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
							style={{ borderTop: "1px solid var(--surface-panel-border)" }}
						>
							<div className="flex items-center gap-2">
								<span className="rounded-lg bg-indigo-500/10 px-2.5 py-1 font-inter text-xs font-semibold text-indigo-600">
									{total}
								</span>
								<span className="font-inter text-xs text-smile-description">
									events
								</span>
								<span className="text-smile-description/40">·</span>
								<span className="font-inter text-xs text-smile-description">
									Page{" "}
									<span className="font-semibold text-smile-primary-dark">
										{page}
									</span>
									{" / "}
									<span className="font-semibold text-smile-primary-dark">
										{totalPages}
									</span>
								</span>
							</div>
							<div className="flex items-center gap-1.5">
								<button
									type="button"
									onClick={() => setPage((p) => Math.max(1, p - 1))}
									disabled={page === 1}
									className="flex h-8 w-8 items-center justify-center rounded-lg border border-indigo-500/20 text-indigo-600 transition-all hover:bg-indigo-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
								>
									<Icon icon="lucide:chevron-left" width={14} />
								</button>
								{pageNums().map((p) => (
									<button
										key={p}
										type="button"
										onClick={() => setPage(p)}
										className={`flex h-8 w-8 items-center justify-center rounded-lg font-inter text-xs font-semibold transition-all ${page === p ? "bg-indigo-500 text-white shadow-sm" : "border border-indigo-500/20 text-indigo-600 hover:bg-indigo-500/10"}`}
									>
										{p}
									</button>
								))}
								<button
									type="button"
									onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
									disabled={page >= totalPages}
									className="flex h-8 w-8 items-center justify-center rounded-lg border border-indigo-500/20 text-indigo-600 transition-all hover:bg-indigo-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
								>
									<Icon icon="lucide:chevron-right" width={14} />
								</button>
							</div>
						</motion.div>
					)}
				</div>
			</motion.div>
		</div>
	);
}
