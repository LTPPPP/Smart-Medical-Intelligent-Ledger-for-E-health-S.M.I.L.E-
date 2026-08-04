import { useMemo } from "react";

import { useQuery } from "@tanstack/react-query";

import type { UserProfile } from "@/features/admin/types/admin.type";
import { apiClient } from "@/shared/api/client";
import { API_ENDPOINTS } from "@/shared/api/endpoint";

export interface DoctorOption {
	id: string;
	name: string;
}

/** Real doctor accounts (role=DOCTOR) — Requires ADMIN or MANAGER. */
export function useDoctorDirectory() {
	const { data, isLoading } = useQuery({
		queryKey: ["user-profiles", "role", "DOCTOR"],
		queryFn: () =>
			// limit Is Capped At 50 By QueryUserProfileDto's `@Max(50)`.
			apiClient.get<{ data: UserProfile[] }>(
				API_ENDPOINTS.ADMIN.USER_PROFILES.LIST,
				{ params: { role: "DOCTOR", limit: 50 } },
			),
	});

	const doctors = useMemo<DoctorOption[]>(
		() =>
			(data?.data?.data ?? []).map((p) => ({
				id: p.user_id,
				name: p.full_name,
			})),
		[data],
	);

	return { doctors, isLoading };
}
