export interface DocumentSummary {
	doc_id: string;
	filename: string;
	uploaded_at: string;
	chunk_count: number;
}

export interface DocumentListResponse {
	documents: DocumentSummary[];
}

export interface DocumentUploadResponse {
	doc_id: string;
	filename: string;
	chunk_count: number;
	warnings: string[];
}
