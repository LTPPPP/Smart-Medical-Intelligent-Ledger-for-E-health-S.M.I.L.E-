"use client";

import { useMemo } from "react";

import { Icon } from "@iconify/react";
import { motion } from "framer-motion";

import { ACTION_LABELS } from "@/features/admin/constants/permissions.constants";
import type { RoleApi, PermissionApi } from "@/features/admin/types/admin.type";
import {
	groupByResource,
	getAllActions,
} from "@/features/admin/utils/permissions.utils";

export interface PermissionMatrixProps {
	role: RoleApi;
	allPermissions: PermissionApi[];
	rolePermissions: PermissionApi[];
	isLoadingAll: boolean;
	isLoadingRole: boolean;
	isToggling: boolean;
	feedback: Record<string, "success" | "error">;
	onToggle: (perm: PermissionApi, assigned: boolean) => Promise<void>;
	onAddPermission: () => void;
}

export function PermissionMatrix({
	role,
	allPermissions,
	rolePermissions,
	isLoadingAll,
	isLoadingRole,
	isToggling,
	feedback,
	onToggle,
	onAddPermission,
}: PermissionMatrixProps) {
	const rolePermissionIds = useMemo(
		() => new Set(rolePermissions.map((p) => p.permission_id)),
		[rolePermissions],
	);
	const grouped = useMemo(
		() => groupByResource(allPermissions),
		[allPermissions],
	);
	const actions = useMemo(
		() => getAllActions(allPermissions),
		[allPermissions],
	);
	const resources = useMemo(() => [...grouped.keys()].sort(), [grouped]);

	if (isLoadingAll || isLoadingRole) {
		return (
			<div className="flex items-center justify-center py-8">
				<div className="h-5 w-5 animate-spin rounded-full border-2 border-smile-primary border-t-transparent" />
				<span className="ml-2 font-inter text-xs text-smile-description">
					Loading permissions…
				</span>
			</div>
		);
	}

	return (
		<div className="space-y-3 px-4 pb-4 pt-3">
			<div className="flex items-center justify-between">
				<p className="font-inter text-xs font-semibold uppercase tracking-wider text-smile-description">
					Permissions for{" "}
					<span className="font-bold text-smile-primary">{role.role_name}</span>
				</p>
				<button
					type="button"
					onClick={onAddPermission}
					className="flex items-center gap-1.5 rounded-lg bg-smile-primary/10 px-3 py-1.5 font-inter text-xs font-semibold text-smile-primary transition-colors hover:bg-smile-primary/20"
				>
					<Icon icon="lucide:plus" width={12} />
					New Permission
				</button>
			</div>

			{allPermissions.length === 0 ? (
				<div
					className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-8"
					style={{ borderColor: "var(--surface-card-border)" }}
				>
					<Icon
						icon="lucide:key-round"
						width={24}
						className="text-smile-description opacity-40"
					/>
					<p className="font-inter text-xs text-smile-description">
						No permissions defined in the system yet
					</p>
					<button
						type="button"
						onClick={onAddPermission}
						className="mt-1 flex items-center gap-1.5 rounded-lg bg-smile-primary px-3 py-1.5 font-inter text-xs font-semibold text-white hover:bg-smile-primary/90"
					>
						<Icon icon="lucide:plus" width={12} />
						Create First Permission
					</button>
				</div>
			) : (
				<div
					className="overflow-x-auto rounded-xl border"
					style={{ borderColor: "var(--surface-card-border)" }}
				>
					<table className="w-full min-w-[480px]">
						<thead>
							<tr
								className="border-b"
								style={{
									borderColor: "var(--surface-card-border)",
									background: "var(--surface-input-bg)",
								}}
							>
								<th className="px-4 py-2.5 text-left font-inter text-[11px] font-semibold uppercase tracking-wider text-smile-primary/70">
									Resource / Type
								</th>
								{actions.map((action) => (
									<th
										key={action}
										className="px-3 py-2.5 text-center font-inter text-[11px] font-semibold uppercase tracking-wider text-smile-primary/70"
									>
										{ACTION_LABELS[action] ?? action}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{resources.map((resource) => {
								const perms = grouped.get(resource) ?? [];
								return (
									<tr
										key={resource}
										className="border-b last:border-0 transition-colors hover:bg-smile-primary/5 dark:hover:bg-smile-primary/10"
										style={{ borderColor: "var(--surface-card-border)" }}
									>
										<td className="px-4 py-2.5">
											<span className="inline-flex items-center gap-1.5 rounded-md bg-smile-primary/10 px-2.5 py-0.5 font-inter text-xs font-semibold capitalize text-smile-primary dark:bg-smile-primary/20">
												<Icon icon="lucide:layers-3" width={10} />
												{resource.replace(/_/g, " ")}
											</span>
										</td>
										{actions.map((action) => {
											const perm = perms.find(
												(p) =>
													(p.action ?? p.permission_name.split(".").pop()) ===
													action,
											);
											if (!perm) {
												return (
													<td key={action} className="px-3 py-2.5 text-center">
														<span className="select-none text-xs text-smile-description opacity-20">
															—
														</span>
													</td>
												);
											}
											const assigned = rolePermissionIds.has(
												perm.permission_id,
											);
											const fb = feedback[perm.permission_id];
											return (
												<td
													key={action}
													className={
														"px-3 py-2.5 text-center transition-colors duration-300 " +
														(fb === "success"
															? "bg-emerald-50 dark:bg-emerald-900/20"
															: "")
													}
												>
													<motion.span
														key={
															fb === "error"
																? `err-${perm.permission_id}`
																: `ok-${perm.permission_id}`
														}
														animate={
															fb === "error"
																? { x: [0, -4, 4, -3, 3, 0] }
																: { x: 0 }
														}
														transition={{ duration: 0.35 }}
														className="inline-block"
													>
														<label
															className="inline-flex cursor-pointer items-center justify-center"
															title={perm.description ?? perm.permission_name}
														>
															<input
																type="checkbox"
																checked={assigned}
																disabled={isToggling}
																onChange={() => onToggle(perm, assigned)}
																className="h-4 w-4 cursor-pointer rounded accent-smile-primary transition-transform duration-100 active:scale-90 disabled:cursor-not-allowed disabled:opacity-60"
															/>
														</label>
													</motion.span>
												</td>
											);
										})}
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}
