"use client";

import { useTranslation } from "@/features/i18n";
import { Loading } from "@/shared/components/common/Loading";

export default function PatientsLoading() {
	const { t } = useTranslation();
	return <Loading text={t("patients.loadingList", "Loading patients...")} />;
}
