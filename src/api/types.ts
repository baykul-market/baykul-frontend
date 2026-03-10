export type Currency = string;

export interface PageableSort {
    sorted: boolean;
    unsorted: boolean;
    empty?: boolean;
}

export interface PageResponsePageable {
    pageNumber: number;
    pageSize: number;
    sort: PageableSort;
    offset: number;
    unpaged: boolean;
    paged: boolean;
}

export interface PageResponse<T> {
    content: T[];
    pageable: PageResponsePageable;
    last: boolean;
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
    sort: PageableSort;
    first: boolean;
    numberOfElements: number;
    empty: boolean;
}
