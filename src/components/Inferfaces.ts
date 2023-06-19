export interface QueryResult {
    results: Document[];
    page: number;
    limit: number;
    totalPages: number;
    totalResults: number;
}

export interface IOptions {
    sortBy?: string;
    projectBy?: string;
    populate?: string;
    limit?: number;
    page?: number;
}