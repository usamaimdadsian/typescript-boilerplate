class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
    }
}

class ApiError extends Error {
    public status: string;
    constructor(status: string, message: string ) {
        super(message);
        this.status = status;
    }
}

export { ValidationError, ApiError }