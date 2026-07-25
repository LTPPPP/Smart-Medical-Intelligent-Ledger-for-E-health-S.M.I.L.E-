import { cn } from "@/shared/lib/utils";

interface GradientTextProps {
	children: React.ReactNode;
	className?: string;
	as?: "h1" | "h2" | "h3" | "span" | "p";
}

export function GradientText({
	children,
	className,
	as: Tag = "h2",
}: GradientTextProps) {
	return (
		<Tag
			className={cn("bg-clip-text text-transparent", className)}
			style={{ backgroundImage: "var(--gradient-brand)" }}
		>
			{children}
		</Tag>
	);
}
