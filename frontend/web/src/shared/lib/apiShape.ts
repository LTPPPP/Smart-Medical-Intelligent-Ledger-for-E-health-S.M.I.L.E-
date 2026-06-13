import type { PaginatedResponse } from '@/shared/types/response.type';

type MetaShape = {
  page?: number;
  limit?: number;
  total?: number;
};

type LoosePage<T> =
  | PaginatedResponse<T>
  | T[]
  | {
      content?: T[];
      data?: T[] | { content?: T[] };
      meta?: MetaShape;
      totalPages?: number;
      totalElements?: number;
      number?: number;
      size?: number;
    };

export function toPage<T>(
  value: LoosePage<T> | undefined | null,
  fallback: T[],
  page = 0,
  size = 12,
): PaginatedResponse<T> {
  const source = value ?? fallback;
  const directArray = Array.isArray(source) ? source : undefined;
  const nestedData =
    !directArray && source && 'data' in source ? source.data : undefined;
  const nestedContent =
    nestedData && !Array.isArray(nestedData) ? nestedData.content : undefined;
  const content =
    directArray ??
    (!directArray && source && 'content' in source ? source.content : undefined) ??
    (Array.isArray(nestedData) ? nestedData : undefined) ??
    nestedContent ??
    fallback;
  const meta = !directArray && source && 'meta' in source ? source.meta : undefined;
  const totalElements =
    (!directArray && source && 'totalElements' in source
      ? source.totalElements
      : undefined) ??
    meta?.total ??
    content.length;
  const pageSize =
    (!directArray && source && 'size' in source ? source.size : undefined) ??
    meta?.limit ??
    size;
  const pageNumber =
    (!directArray && source && 'number' in source ? source.number : undefined) ??
    Math.max((meta?.page ?? page + 1) - 1, 0);
  const totalPages =
    (!directArray && source && 'totalPages' in source
      ? source.totalPages
      : undefined) ?? Math.max(1, Math.ceil(totalElements / pageSize));

  return {
    content,
    totalPages,
    totalElements,
    number: pageNumber,
    size: pageSize,
    first: pageNumber <= 0,
    last: pageNumber >= totalPages - 1,
    empty: content.length === 0,
  };
}

export function unwrapData<T>(value: { data?: T } | T | undefined, fallback: T): T {
  if (!value) return fallback;
  if (typeof value === 'object' && value !== null && 'data' in value) {
    return value.data ?? fallback;
  }
  return value as T;
}
