"use client";

import Link from "next/link";

import { useTranslation } from "@/features/i18n";
import { Button } from "@/shared/components/ui/button";
import { ROUTES } from "@/shared/constants";

export default function NotFound() {
	const { t } = useTranslation();

	return (
		<div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
			<h1 className="text-6xl font-bold">404</h1>
			<h2 className="text-xl font-semibold">{t("common.notFoundTitle")}</h2>
			<p className="max-w-md text-sm text-muted-foreground">
				{t("common.notFoundDescription")}
			</p>
			<Button render={<Link href={ROUTES.DASHBOARD} />}>
				{t("common.goToDashboard")}
			</Button>
		</div>
	);
}
