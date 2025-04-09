export enum HttpStatus {
    // 2xx Success
    OK = 200, // Standard response for successful HTTP requests
    CREATED = 201, // Resource successfully created
    ACCEPTED = 202, // Request accepted but processing is not complete
    NO_CONTENT = 204, // Successful but no content to return
  
    // 3xx Redirection
    MOVED_PERMANENTLY = 301, // Resource has permanently moved
    FOUND = 302, // Resource temporarily located at different URI
    NOT_MODIFIED = 304, // Resource not modified since last request
  
    // 4xx Client Errors
    BAD_REQUEST = 400, // Invalid request syntax or parameters
    UNAUTHORIZED = 401, // Authentication required or failed
    FORBIDDEN = 403, // Authenticated but not authorized
    NOT_FOUND = 404, // Resource not found
    METHOD_NOT_ALLOWED = 405, // HTTP method not supported
    CONFLICT = 409, // Conflict with current state of the server
    PAYLOAD_TOO_LARGE = 413, // Request entity too large
    UNSUPPORTED_MEDIA_TYPE = 415, // Unsupported content type
    UNPROCESSABLE_ENTITY = 422, // Semantic errors in the request body
    TOO_MANY_REQUESTS = 429, // Rate limiting
  
    // 5xx Server Errors
    INTERNAL_SERVER_ERROR = 500, // Generic server error
    NOT_IMPLEMENTED = 501, // Endpoint/method not implemented
    BAD_GATEWAY = 502, // Invalid response from upstream server
    SERVICE_UNAVAILABLE = 503, // Server is temporarily overloaded or down
    GATEWAY_TIMEOUT = 504, // Upstream server failed to respond in time
  }
  