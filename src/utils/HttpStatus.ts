import {Response} from "express"

export const HttpStatus = {
    // Informational
    CONTINUE: "CONTINUE",

    // Success
    OK: "OK",
    CREATED: "CREATED",
    ACCEPTED: "ACCEPTED",
    NO_CONTENT: "NO_CONTENT",
    RESET_CONTENT: "RESET_CONTENT",
    PARTIAL_CONTENT: "PARTIAL_CONTENT",

    // Redirection
    MULTIPLE_CHOICES: "MULTIPLE_CHOICES",
    MOVED_PERMANENTLY: "MOVED_PERMANENTLY",
    FOUND: "FOUND",
    SEE_OTHER: "SEE_OTHER",
    NOT_MODIFIED: "NOT_MODIFIED",
    USE_PROXY: "USE_PROXY",
    TEMPORARY_REDIRECT: "TEMPORARY_REDIRECT",
    PERMANENT_REDIRECT: "PERMANENT_REDIRECT",

    // Client Errors
    BAD_REQUEST: "BAD_REQUEST",
    UNAUTHORIZED: "UNAUTHORIZED",
    FORBIDDEN: "FORBIDDEN",
    NOT_FOUND: "NOT_FOUND",
    METHOD_NOT_ALLOWED: "METHOD_NOT_ALLOWED",
    NOT_ACCEPTABLE: "NOT_ACCEPTABLE",
    REQUEST_TIMEOUT: "REQUEST_TIMEOUT",
    CONFLICT: "CONFLICT",
    GONE: "GONE",
    LENGTH_REQUIRED: "LENGTH_REQUIRED",
    PRECONDITION_FAILED: "PRECONDITION_FAILED",
    PAYLOAD_TOO_LARGE: "PAYLOAD_TOO_LARGE",
    URI_TOO_LONG: "URI_TOO_LONG",
    UNSUPPORTED_MEDIA_TYPE: "UNSUPPORTED_MEDIA_TYPE",
    TOO_MANY_REQUESTS: "TOO_MANY_REQUESTS",
    INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",

    // Server Errors
    NOT_IMPLEMENTED: "NOT_IMPLEMENTED",
    BAD_GATEWAY: "BAD_GATEWAY",
    SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
    GATEWAY_TIMEOUT: "GATEWAY_TIMEOUT",
};

const HttpStatusCodes = {
    // Informational
    CONTINUE: 100,                   // Continue with the request

    // Success
    OK: 200,                         // Successful request
    CREATED: 201,                    // Successful creation of a resource
    ACCEPTED: 202,                   // Request accepted for processing, but not yet completed
    NO_CONTENT: 204,                 // Successful request with no response body
    RESET_CONTENT: 205,              // Request successful, and the requester should reset the view
    PARTIAL_CONTENT: 206,            // Partial response, as requested by the client

    // Redirection
    MULTIPLE_CHOICES: 300,           // Multiple options for the requested resource
    MOVED_PERMANENTLY: 301,          // Resource has been permanently moved to a new URL
    FOUND: 302,                      // Resource has been temporarily moved to a different URL
    SEE_OTHER: 303,                  // Client should retrieve the resource from a different URL
    NOT_MODIFIED: 304,               // Resource has not been modified since the last request
    USE_PROXY: 305,                  // Client should use a proxy server specified in the Location header
    TEMPORARY_REDIRECT: 307,         // Resource has been temporarily moved to a different URL
    PERMANENT_REDIRECT: 308,         // Resource has been permanently moved to a different URL

    // Client Errors
    BAD_REQUEST: 400,                // The server cannot process the request due to client error
    UNAUTHORIZED: 401,               // Authentication is required and has failed or not provided
    FORBIDDEN: 403,                  // Requested resource is forbidden
    NOT_FOUND: 404,                  // Requested resource could not be found
    METHOD_NOT_ALLOWED: 405,         // The request method is not allowed for the given resource
    NOT_ACCEPTABLE: 406,             // The server cannot produce a response matching the client's requested format
    REQUEST_TIMEOUT: 408,            // Client did not produce a request within the server's specified time limit
    CONFLICT: 409,                   // The request conflicts with the current state of the server
    GONE: 410,                       // Requested resource is no longer available and has been permanently removed
    LENGTH_REQUIRED: 411,            // The server requires a Content-Length header to be specified
    PRECONDITION_FAILED: 412,        // Precondition specified in the request failed to evaluate
    PAYLOAD_TOO_LARGE: 413,          // Request payload is larger than the server is willing or able to process
    URI_TOO_LONG: 414,               // The requested URI is too long for the server to process
    UNSUPPORTED_MEDIA_TYPE: 415,     // Request entity has a media type which the server does not support
    TOO_MANY_REQUESTS: 429,          // The user has sent too many requests in a given amount of time
    INTERNAL_SERVER_ERROR: 500,      // The server encountered an unexpected condition and could not fulfill the request

    // Server Errors
    NOT_IMPLEMENTED: 501,            // The server does not support the functionality required to fulfill the request
    BAD_GATEWAY: 502,                // The server received an invalid response from an upstream server
    SERVICE_UNAVAILABLE: 503,        // The server is currently unable to handle the request
    GATEWAY_TIMEOUT: 504,            // The server did not receive a timely response from an upstream server
};

const HttpMessages = {
    // Informational
    CONTINUE: "Continue",

    // Success
    OK: "Successful",
    CREATED: "Resource created",
    ACCEPTED: "Request accepted",
    NO_CONTENT: "No content",
    RESET_CONTENT: "Reset view",
    PARTIAL_CONTENT: "Partial response",

    // Redirection
    MULTIPLE_CHOICES: "Multiple options available",
    MOVED_PERMANENTLY: "Resource permanently moved",
    FOUND: "Resource temporarily moved",
    SEE_OTHER: "Retrieve resource from different URL",
    NOT_MODIFIED: "Resource not modified",
    USE_PROXY: "Use proxy server",
    TEMPORARY_REDIRECT: "Resource temporarily moved",
    PERMANENT_REDIRECT: "Resource permanently moved",

    // Client Errors
    BAD_REQUEST: "Bad request",
    UNAUTHORIZED: "Unauthorized",
    FORBIDDEN: "Forbidden",
    NOT_FOUND: "Not found",
    METHOD_NOT_ALLOWED: "Method not allowed",
    NOT_ACCEPTABLE: "Not acceptable",
    REQUEST_TIMEOUT: "Request timeout",
    CONFLICT: "Conflict",
    GONE: "Resource gone",
    LENGTH_REQUIRED: "Content-Length required",
    PRECONDITION_FAILED: "Precondition failed",
    PAYLOAD_TOO_LARGE: "Payload too large",
    URI_TOO_LONG: "URI too long",
    UNSUPPORTED_MEDIA_TYPE: "Unsupported media type",
    TOO_MANY_REQUESTS: "Too many requests",
    INTERNAL_SERVER_ERROR: "Internal server error",

    // Server Errors
    NOT_IMPLEMENTED: "Not implemented",
    BAD_GATEWAY: "Bad gateway",
    SERVICE_UNAVAILABLE: "Service unavailable",
    GATEWAY_TIMEOUT: "Gateway timeout",
};

export const response = (status: string,res: Response, data: any="") => {
    let res_data = {message: HttpMessages[status]}
    if (data){
        res_data = data
    }
    res.status(HttpStatusCodes[status]).json(res_data)
}