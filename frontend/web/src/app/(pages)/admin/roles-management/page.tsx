"use client";

import React, { useCallback, useEffect, useState } from "react";

import { Icon } from "@iconify/react";
import { AnimatePresence, motion } from "framer-motion";

import {
	fadeUpVariants,
	expandVariants,
} from "@/features/admin/animations/variants";
import { CreatePermissionDialog } from "@/features/admin/components/roles/CreatePermissionDialog";
import { CreateRoleDialog } from "@/features/admin/components/roles/CreateRoleDialog";
import { RoleExpandedSection } from "@/features/admin/components/roles/RoleExpandedSection";
import { useAdmin } from "@/features/admin/hooks/useAdmin";
import type {
	RoleApi,
	CreatePermissionApiRequest,
} from "@/features/admin/types/admin.type";
import { formatDate } from "@/features/admin/utils/date.utils";

export default function AdminRolesManagementPage() {
	const {
		useRolesApi,
		createRoleApi,
		deleteRoleApi,
		isCreatingRole,
		isDeletingRole,
		createPermission,
		isCreatingPermission,
	} = useAdmin();

	const [page, setPage] = useState(1);
	const LIMIT = 10;
	const [searchInput, setSearchInput] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");

	useEffect(() => {
		const t = setTimeout(() => {
			setDebouncedSearch(searchInput);
			setPage(1);
		}, 400);
		return () => clearTimeout(t);
	}, [searchInput]);

	const { data, isLoading, error, refetch } = useRolesApi({
		page,
		limit: LIMIT,
		search: debouncedSearch || undefined,
	});

	const roles = data?.data ?? [];
	const total = data?.total ?? 0;
	const totalPages = Math.max(1, Math.ceil(total / LIMIT));

	const [expandedRoleId, setExpandedRoleId] = useState<string | null>(null);
	const toggleExpand = (roleId: string) =>
		setExpandedRoleId((prev) => (prev === roleId ? null : roleId));

	const [showCreateRole, setShowCreateRole] = useState(false);
	const handleCreateRole = async (name: string, description: string) => {
		await createRoleApi({
			role_name: name,
			description: description || undefined,
		});
		refetch();
	};

	const handleDeleteRole = useCallback(
		async (role: RoleApi) => {
			if (!confirm(`Delete role "${role.role_name}"? This cannot be undone.`))
				return;
			try {
				await deleteRoleApi(role.role_id);
				if (expandedRoleId === role.role_id) setExpandedRoleId(null);
				refetch();
			} catch {
				/* handled by hook */
			}
		},
		[deleteRoleApi, refetch, expandedRoleId],
	);

	const [showCreatePermission, setShowCreatePermission] = useState(false);
	const handleCreatePermission = async (data: CreatePermissionApiRequest) => {
		await createPermission(data);
	};

	const pageNums = (): number[] => {
		if (totalPages <= 5)
			return Array.from({ length: totalPages }, (_, i) => i + 1);
		const start = Math.max(1, page - 2);
		const end = Math.min(totalPages, start + 4);
		return Array.from({ length: end - start + 1 }, (_, i) => start + i);
	};

	return (
		<div className="space-y-5">
			<motion.div
				variants={fadeUpVariants}
				initial="hidden"
				animate="visible"
				custom={0}
			>
				<div
					className="relative overflow-hidden rounded-[24px] border backdrop-blur-xl"
					style={{
						background: "var(--surface-panel-bg)",
						borderColor: "var(--surface-panel-border)",
						boxShadow: "var(--surface-panel-shadow)",
					}}
				>
					<div className="absolute inset-x-0 top-0 h-[2px] rounded-t-[24px] bg-gradient-to-r from-violet-500 to-purple-600" />
					<div
						className="pointer-events-none absolute inset-0 rounded-[24px]"
						style={{
							background:
								"linear-gradient(135deg,rgba(255,255,255,0.08) 0%,rgba(255,255,255,0) 50%)",
						}}
					/>
					<div className="relative flex items-center justify-between px-6 py-5">
						<div className="flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
								<Icon
									icon="lucide:shield-half"
									width={20}
									className="text-violet-500"
								/>
							</div>
							<div>
								<h1 className="font-poppins text-xl font-semibold text-smile-primary-dark">
									Role Management
								</h1>
								<p className="font-inter text-xs text-smile-description">
									{total} role{total !== 1 ? "s" : ""} — click a row to manage
									permissions
								</p>
							</div>
						</div>
						<div className="flex items-center gap-2">
							<button
								type="button"
								onClick={() => setShowCreatePermission(true)}
								className="flex items-center gap-2 rounded-xl border px-4 py-2 font-inter text-sm font-semibold text-violet-600 transition-all hover:bg-violet-50 dark:hover:bg-violet-900/20"
								style={{ borderColor: "var(--surface-card-border)" }}
							>
								<Icon icon="lucide:key-round" width={15} />
								New Permission
							</button>
							<button
								type="button"
								onClick={() => setShowCreateRole(true)}
								className="flex items-center gap-2 rounded-xl bg-smile-primary px-4 py-2 font-inter text-sm font-semibold text-white transition-all hover:bg-smile-primary/90 hover:shadow-[0_4px_14px_rgba(65,126,170,0.4)]"
							>
								<Icon icon="lucide:plus" width={15} />
								Create Role
							</button>
						</div>
					</div>
				</div>
			</motion.div>

			<motion.div
				variants={fadeUpVariants}
				initial="hidden"
				animate="visible"
				custom={1}
			>
				<div
					className="flex items-center gap-3 rounded-[18px] border px-4 py-3 backdrop-blur-xl"
					style={{
						background: "var(--surface-card-bg)",
						borderColor: "var(--surface-card-border)",
						boxShadow: "var(--surface-card-shadow)",
					}}
				>
					<div className="relative flex-1">
						<Icon
							icon="lucide:search"
							width={16}
							className="absolute left-3 top-1/2 -translate-y-1/2 text-smile-description"
						/>
						<input
							type="text"
							placeholder="Search roles…"
							value={searchInput}
							onChange={(e) => setSearchInput(e.target.value)}
							className="w-full rounded-lg py-2 pl-9 pr-3 font-inter text-sm outline-none"
							style={{
								background: "var(--surface-input-bg)",
								border: "1px solid var(--surface-input-border)",
								color: "var(--color-smile-title)",
							}}
						/>
					</div>
					<p className="hidden shrink-0 font-inter text-xs text-smile-description sm:block">
						<Icon icon="lucide:info" width={13} className="mr-1 inline" />
						Click a row to toggle permission matrix
					</p>
				</div>
			</motion.div>

			<motion.div
				variants={fadeUpVariants}
				initial="hidden"
				animate="visible"
				custom={2}
			>
				<div
					className="overflow-hidden rounded-[22px] border backdrop-blur-xl"
					style={{
						background: "var(--surface-card-bg)",
						borderColor: "var(--surface-card-border)",
						boxShadow: "var(--surface-card-shadow)",
					}}
				>
					{isLoading ? (
						<div className="flex items-center justify-center py-20">
							<div className="h-8 w-8 animate-spin rounded-full border-2 border-smile-primary border-t-transparent" />
							<span className="ml-3 font-inter text-sm text-smile-description">
								Loading roles…
							</span>
						</div>
					) : error ? (
						<div className="flex flex-col items-center justify-center gap-3 py-16">
							<Icon
								icon="lucide:alert-circle"
								width={32}
								className="text-red-400"
							/>
							<p className="font-inter text-sm text-red-500">
								Failed to load roles
							</p>
							<button
								type="button"
								onClick={() => refetch()}
								className="rounded-lg bg-red-50 px-3 py-1.5 text-xs text-red-600 hover:bg-red-100"
							>
								Retry
							</button>
						</div>
					) : roles.length === 0 ? (
						<div className="flex flex-col items-center justify-center gap-3 py-16">
							<Icon
								icon="lucide:shield-off"
								width={32}
								className="text-smile-description opacity-40"
							/>
							<p className="font-inter text-sm text-smile-description">
								{debouncedSearch
									? `No roles match "${debouncedSearch}"`
									: "No roles found"}
							</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full">
								<thead>
									<tr
										className="border-b"
										style={{ borderColor: "var(--surface-card-border)" }}
									>
										<th className="w-10 px-3 py-3.5" />
										<th className="px-5 py-3.5 text-left font-inter text-[11px] font-semibold uppercase tracking-wider text-smile-description">
											Role Name
										</th>
										<th className="px-5 py-3.5 text-left font-inter text-[11px] font-semibold uppercase tracking-wider text-smile-description">
											Description
										</th>
										<th className="px-5 py-3.5 text-left font-inter text-[11px] font-semibold uppercase tracking-wider text-smile-description">
											Created
										</th>
										<th className="px-5 py-3.5" />
									</tr>
								</thead>
								<tbody>
									{roles.map((role) => {
										const isExpanded = expandedRoleId === role.role_id;
										return (
											<React.Fragment key={role.role_id}>
												<motion.tr
													initial={{ opacity: 0, y: 8 }}
													animate={{ opacity: 1, y: 0 }}
													exit={{ opacity: 0 }}
													transition={{ duration: 0.2 }}
													className="border-b transition-colors last:border-0 hover:bg-smile-primary/5"
													style={{ borderColor: "var(--surface-card-border)" }}
												>
													<td className="px-3 py-3.5">
														<button
															type="button"
															onClick={() => toggleExpand(role.role_id)}
															className="flex h-6 w-6 items-center justify-center rounded-md text-smile-description transition-all hover:bg-violet-100 hover:text-violet-600 dark:hover:bg-violet-900/30"
															title={
																isExpanded
																	? "Collapse permissions"
																	: "Expand permissions"
															}
														>
															<motion.div
																animate={{ rotate: isExpanded ? 90 : 0 }}
																transition={{ duration: 0.2 }}
															>
																<Icon icon="lucide:chevron-right" width={14} />
															</motion.div>
														</button>
													</td>
													<td className="px-5 py-3.5">
														<button
															type="button"
															onClick={() => toggleExpand(role.role_id)}
															className="flex items-center gap-1.5"
														>
															<span className="inline-flex items-center gap-1.5 rounded-lg bg-violet-100 px-2.5 py-1 font-inter text-xs font-semibold uppercase tracking-wide text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
																<Icon icon="lucide:shield-half" width={11} />
																{role.role_name}
															</span>
														</button>
													</td>
													<td className="px-5 py-3.5">
														<span className="font-inter text-sm text-smile-description line-clamp-2">
															{role.description ?? (
																<span className="italic opacity-50">
																	No description
																</span>
															)}
														</span>
													</td>
													<td className="px-5 py-3.5">
														<span className="font-inter text-sm text-smile-description">
															{formatDate(role.created_at)}
														</span>
													</td>
													<td className="px-5 py-3.5">
														<button
															type="button"
															onClick={() => handleDeleteRole(role)}
															disabled={isDeletingRole}
															className="rounded-lg p-1.5 text-red-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-900/20"
															title="Delete role"
														>
															<Icon icon="lucide:trash-2" width={15} />
														</button>
													</td>
												</motion.tr>
												<AnimatePresence>
													{isExpanded && (
														<tr
															className="border-b"
															style={{
																borderColor: "var(--surface-card-border)",
															}}
														>
															<td
																colSpan={5}
																className="p-0"
																style={{
																	background: "var(--surface-input-bg)",
																}}
															>
																<motion.div
																	key={`${role.role_id}-exp`}
																	variants={expandVariants}
																	initial="hidden"
																	animate="visible"
																	exit="exit"
																	style={{ overflow: "hidden" }}
																>
																	<div className="ml-3 border-l-2 border-violet-400">
																		<RoleExpandedSection
																			role={role}
																			onAddPermission={() =>
																				setShowCreatePermission(true)
																			}
																		/>
																	</div>
																</motion.div>
															</td>
														</tr>
													)}
												</AnimatePresence>
											</React.Fragment>
										);
									})}
								</tbody>
							</table>
						</div>
					)}

					{!isLoading && !error && total > LIMIT && (
						<div
							className="flex items-center justify-between border-t px-5 py-3"
							style={{ borderColor: "var(--surface-card-border)" }}
						>
							<p className="font-inter text-xs text-smile-description">
								Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)}{" "}
								of {total}
							</p>
							<div className="flex items-center gap-1">
								<button
									type="button"
									onClick={() => setPage((p) => Math.max(1, p - 1))}
									disabled={page === 1}
									className="rounded-lg p-1.5 text-smile-description transition-colors hover:bg-smile-primary/10 hover:text-smile-primary disabled:opacity-40"
								>
									<Icon icon="lucide:chevron-left" width={16} />
								</button>
								{pageNums().map((n) => (
									<button
										type="button"
										key={n}
										onClick={() => setPage(n)}
										className="h-7 w-7 rounded-lg font-inter text-xs font-medium transition-colors"
										style={
											n === page
												? { background: "#417EAA", color: "#fff" }
												: { color: "var(--color-smile-description)" }
										}
									>
										{n}
									</button>
								))}
								<button
									type="button"
									onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
									disabled={page === totalPages}
									className="rounded-lg p-1.5 text-smile-description transition-colors hover:bg-smile-primary/10 hover:text-smile-primary disabled:opacity-40"
								>
									<Icon icon="lucide:chevron-right" width={16} />
								</button>
							</div>
						</div>
					)}
				</div>
			</motion.div>

			<AnimatePresence>
				{showCreateRole && (
					<CreateRoleDialog
						isLoading={isCreatingRole}
						onClose={() => setShowCreateRole(false)}
						onCreate={handleCreateRole}
					/>
				)}
			</AnimatePresence>

			<AnimatePresence>
				{showCreatePermission && (
					<CreatePermissionDialog
						isLoading={isCreatingPermission}
						onClose={() => setShowCreatePermission(false)}
						onCreate={handleCreatePermission}
					/>
				)}
			</AnimatePresence>
		</div>
	);
}
