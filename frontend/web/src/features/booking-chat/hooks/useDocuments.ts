import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
	deleteDocument,
	listDocuments,
	updateDocument,
	uploadDocument,
} from "../documents.api";

const DOCUMENTS_QUERY_KEY = ["ai", "booking-chat", "documents"];

export function useDocuments() {
	return useQuery({
		queryKey: DOCUMENTS_QUERY_KEY,
		queryFn: listDocuments,
	});
}

export function useUploadDocument() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (file: File) => uploadDocument(file),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: DOCUMENTS_QUERY_KEY });
		},
	});
}

export function useUpdateDocument() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ docId, file }: { docId: string; file: File }) =>
			updateDocument(docId, file),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: DOCUMENTS_QUERY_KEY });
		},
	});
}

export function useDeleteDocument() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (docId: string) => deleteDocument(docId),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: DOCUMENTS_QUERY_KEY });
		},
	});
}
