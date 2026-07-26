export interface BaseResponse<T> {
	data: T;
	success: boolean;
	statusCode?: number;
	message: string;
	errorCode?: string | null;
	timestamp?: string;
}

export interface PaginatedResponse<T> {
	content: T[];
	totalPages: number;
	totalElements: number;
	number: number;
	size: number;
	first: boolean;
	last: boolean;
	empty: boolean;
	pageable?: {
		pageNumber: number;
		pageSize: number;
		paged: boolean;
		unpaged: boolean;
		offset: number;
		sort: {
			sorted: boolean;
			unsorted: boolean;
			empty: boolean;
		};
	};
	sort?: {
		sorted: boolean;
		unsorted: boolean;
		empty: boolean;
	};
	numberOfElements?: number;
}
