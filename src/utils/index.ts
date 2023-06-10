import { HttpStatus, response } from "./HttpStatus";

class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
    }
}

export { HttpStatus, response, ValidationError }