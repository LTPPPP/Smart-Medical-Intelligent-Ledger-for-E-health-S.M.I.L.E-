import Link from "next/link";

import { Button } from "@/shared/components/ui/button";
import { ROUTES } from "@/shared/constants";

export default function NotFound() {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
			<h1 className="text-6xl font-bold">404</h1>
			<h2 className="text-xl font-semibold">Page not found</h2>
			<p className="max-w-md text-sm text-muted-foreground">
				The page you&apos;re looking for doesn&apos;t exist or has been moved.
			</p>
			<Button render={<Link href={ROUTES.DASHBOARD} />}>Go to Dashboard</Button>
		</div>
	);
}
