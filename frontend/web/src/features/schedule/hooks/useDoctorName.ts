import { useMemo } from "react";

import { useQueries, useQuery } from "@tanstack/react-query";

import { doctorName as fallbackDoctorName } from "@/features/schedule/scheduleConstants";
import { apiClient } from "@/shared/api/client";
import { API_ENDPOINTS } from "@/shared/api/endpoint";

interface ProfileRes {
	data?: { full_name?: string };
}

// GET /user-profiles/:id Is Unauthenticated/Unguarded — Safe To Call For Any Doctor Id.
function profileNameQuery(id: string) {
	return {
		queryKey: ["user-profile", id],
		queryFn: () =>
			apiClient.get<{ full_name?: string }>(
				API_ENDPOINTS.ADMIN.USER_PROFILES.DETAIL(id),
			),
		staleTime: 10 * 60 * 1000,
	};
}

export function useDoctorName(id?: string): string {
	const { data } = useQuery({
		...profileNameQuery(id ?? ""),
		enabled: !!id,
	});
	const fullName = (data as ProfileRes | undefined)?.data?.full_name;
	return fullName ?? fallbackDoctorName(id);
}

export function useDoctorNames(
	ids: (string | undefined)[],
): Record<string, string> {
	const uniqueIds = useMemo(
		() => Array.from(new Set(ids.filter((id): id is string => !!id))),
		[ids],
	);
	const queries = useQueries({
		queries: uniqueIds.map((id) => profileNameQuery(id)),
	});

	return useMemo(() => {
		const map: Record<string, string> = {};
		uniqueIds.forEach((id, i) => {
			const fullName = (queries[i]?.data as ProfileRes | undefined)?.data
				?.full_name;
			map[id] = fullName ?? fallbackDoctorName(id);
		});
		return map;
	}, [uniqueIds, queries]);
}
