import { apiClient } from "@/shared/api/client";
import { API_ENDPOINTS } from "@/shared/api/endpoint";

import type {
	DocumentListResponse,
	DocumentUploadResponse,
} from "./documents.types";

export async function listDocuments(): Promise<DocumentListResponse> {
	const { data } = await apiClient.get<DocumentListResponse>(
		API_ENDPOINTS.AI.DOCUMENTS.LIST,
	);
	return data;
}

export async function uploadDocument(
	file: File,
): Promise<DocumentUploadResponse> {
	const form = new FormData();
	form.append("file", file);
	const { data } = await apiClient.post<DocumentUploadResponse>(
		API_ENDPOINTS.AI.DOCUMENTS.UPLOAD,
		form,
		{ headers: { "Content-Type": "multipart/form-data" }, timeout: 60_000 },
	);
	return data;
}

export async function updateDocument(
	docId: string,
	file: File,
): Promise<DocumentUploadResponse> {
	const form = new FormData();
	form.append("file", file);
	const { data } = await apiClient.put<DocumentUploadResponse>(
		API_ENDPOINTS.AI.DOCUMENTS.UPDATE(docId),
		form,
		{ headers: { "Content-Type": "multipart/form-data" }, timeout: 60_000 },
	);
	return data;
}

export async function deleteDocument(docId: string): Promise<void> {
	await apiClient.delete(API_ENDPOINTS.AI.DOCUMENTS.DELETE(docId));
}
