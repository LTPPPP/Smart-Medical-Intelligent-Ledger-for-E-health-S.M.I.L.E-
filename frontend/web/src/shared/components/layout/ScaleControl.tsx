"use client";

import { useCallback, useState } from "react";

import { Icon } from "@iconify/react";
import { AnimatePresence, motion } from "framer-motion";

import { useEscapeToClose } from "@/shared/hooks";

import { UI_SCALES, useUiScale } from "./ScaleProvider";

/** Text Size Control */
export function ScaleControl() {
	const { scale, setScale } = useUiScale();
	const [open, setOpen] = useState(false);

	useEscapeToClose(useCallback(() => setOpen(false), []));

	return (
		<div className="relative">
			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				className="rounded-full p-2 text-smile-description transition-all hover:bg-smile-primary-light/40 hover:text-smile-primary"
				aria-label="Text size"
				aria-expanded={open}
			>
				<Icon icon="lucide:a-large-small" width={18} />
			</button>

			<AnimatePresence>
				{open && (
					<>
						<button
							type="button"
							aria-hidden
							tabIndex={-1}
							onClick={() => setOpen(false)}
							className="fixed inset-0 z-40 cursor-default"
						/>
						<motion.div
							initial={{ opacity: 0, y: -6, scale: 0.97 }}
							animate={{ opacity: 1, y: 0, scale: 1 }}
							exit={{ opacity: 0, y: -6, scale: 0.97 }}
							transition={{ duration: 0.14, ease: "easeOut" }}
							className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-2xl border p-1.5 backdrop-blur-2xl"
							style={{
								background: "var(--surface-card-bg)",
								borderColor: "var(--surface-card-border)",
								boxShadow: "var(--surface-card-shadow)",
							}}
						>
							{UI_SCALES.map((option) => {
								const active = option.value === scale;
								return (
									<button
										key={option.value}
										type="button"
										onClick={() => {
											setScale(option.value);
											setOpen(false);
										}}
										className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left font-inter transition-all ${
											active
												? "bg-smile-primary/15 text-smile-primary"
												: "text-smile-title hover:bg-smile-primary-light/60 hover:text-smile-primary"
										}`}
									>
										<Icon
											icon={active ? "lucide:check" : "lucide:type"}
											width={15}
											className="shrink-0"
										/>
										<span className="flex flex-1 flex-col">
											<span className="text-sm font-medium">{option.label}</span>
											<span className="text-xs text-smile-description">
												{option.hint}
											</span>
										</span>
									</button>
								);
							})}
						</motion.div>
					</>
				)}
			</AnimatePresence>
		</div>
	);
}
