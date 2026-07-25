"use client";

import type { MouseEvent } from "react";

import { Icon } from "@iconify/react";

import type { Specialty } from "../types/service.type";

interface SpecialtyCardProps {
	specialty: Specialty;
	selected?: boolean;
	onClick?: () => void;
	onEdit?: () => void;
	onDelete?: () => void;
	isAdmin?: boolean;
}

export function SpecialtyCard({
	specialty,
	selected,
	onClick,
	onEdit,
	onDelete,
	isAdmin = false,
}: SpecialtyCardProps) {
	const handleAction = (
		event: MouseEvent<HTMLButtonElement>,
		action?: () => void,
	) => {
		event.stopPropagation();
		action?.();
	};

	return (
		<div
			role={onClick ? "button" : undefined}
			tabIndex={onClick ? 0 : undefined}
			onClick={onClick}
			onKeyDown={(event) => {
				if (!onClick) return;
				if (event.key === "Enter" || event.key === " ") {
					event.preventDefault();
					onClick();
				}
			}}
			className={`w-full rounded-lg border p-3 text-left transition-all ${
				selected
					? "border-blue-500 bg-blue-50"
					: "border-gray-200 bg-white hover:border-blue-300"
			}`}
		>
			<div className="flex items-center justify-between gap-3">
				<div className="flex min-w-0 items-center gap-3">
					{specialty.iconUrl ? (
						<Icon
							icon={specialty.iconUrl}
							className="shrink-0 text-2xl text-blue-600"
						/>
					) : (
						<Icon
							icon="mdi:medical-bag"
							className="shrink-0 text-2xl text-blue-400"
						/>
					)}
					<span className="truncate font-medium text-gray-900">
						{specialty.specialtyName}
					</span>
				</div>
				{isAdmin ? (
					<span className="flex shrink-0 gap-1">
						{onEdit ? (
							<button
								type="button"
								onClick={(event) => handleAction(event, onEdit)}
								className="rounded-md p-1 text-blue-600 hover:bg-blue-100"
								aria-label={`Edit ${specialty.specialtyName}`}
							>
								<Icon icon="mdi:pencil" />
							</button>
						) : null}
						{onDelete ? (
							<button
								type="button"
								onClick={(event) => handleAction(event, onDelete)}
								className="rounded-md p-1 text-red-600 hover:bg-red-100"
								aria-label={`Delete ${specialty.specialtyName}`}
							>
								<Icon icon="mdi:trash-can-outline" />
							</button>
						) : null}
					</span>
				) : null}
			</div>
		</div>
	);
}
