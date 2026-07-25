"use client";

import { Icon } from "@iconify/react";

import { cn } from "@/shared/lib/utils";

interface LoadingProps {
	text?: string;
	fullScreen?: boolean;
	className?: string;
	size?: number;
}

export const Loading = ({
	text = "Loading...",
	fullScreen = false,
	className,
	size = 40,
}: LoadingProps) => {
	const content = (
		<div
			className={cn(
				"flex flex-col items-center justify-center gap-3",
				className,
			)}
		>
			<Icon
				icon="line-md:loading-twotone-loop"
				width={size}
				height={size}
				className="text-blue-600"
			/>
			{text && (
				<p className="text-sm font-medium text-gray-500 animate-pulse">
					{text}
				</p>
			)}
		</div>
	);

	if (fullScreen) {
		return (
			<div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/80 backdrop-blur-sm">
				{content}
			</div>
		);
	}

	return (
		<div className="w-full py-10 flex items-center justify-center">
			{content}
		</div>
	);
};
