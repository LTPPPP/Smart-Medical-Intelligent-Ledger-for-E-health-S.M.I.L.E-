"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { kycApi, type SubmitKycPayload } from "../api/kyc";

const KYC_KEY = ["kyc", "me"];

export function useMyKyc() {
	return useQuery({
		queryKey: KYC_KEY,
		queryFn: () => kycApi.getMyKyc(),
		retry: false,
	});
}

export function useSubmitKyc() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (payload: SubmitKycPayload) => kycApi.submitKyc(payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: KYC_KEY });
		},
	});
}
