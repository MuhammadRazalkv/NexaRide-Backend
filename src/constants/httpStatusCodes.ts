export enum HttpStatus {
  // ─────────────────────────
  // ✅ 2xx Success
  // ─────────────────────────

  OK = 200, // ✔️ Standard response for successful GET/PUT/DELETE requests
  CREATED = 201, // ✔️ Resource was successfully created (use in POST)
  ACCEPTED = 202, // ✔️ Request accepted for processing, but not completed yet (async tasks)
  NO_CONTENT = 204, // ✔️ Request successful but nothing to return (e.g., DELETE with no response body)

  // ─────────────────────────
  // 🔀 3xx Redirection
  // ─────────────────────────

  MOVED_PERMANENTLY = 301, // 🔀 Resource moved permanently (update links/bookmarks)
  FOUND = 302, // 🔀 Temporary redirect (e.g., login redirect)
  SEE_OTHER = 303, // 🔀 Redirect after POST to a GET (e.g., PRG pattern)
  NOT_MODIFIED = 304, // 🔀 Resource not modified (use with caching)

  // ─────────────────────────
  // ❌ 4xx Client Errors
  // ─────────────────────────

  BAD_REQUEST = 400, // ❌ Invalid input, missing fields, validation failed
  UNAUTHORIZED = 401, // 🔒 Authentication required or failed (missing/invalid token)
  FORBIDDEN = 403, // 🔒 Authenticated but not allowed to access the resource
  NOT_FOUND = 404, // ❌ Requested resource doesn’t exist (e.g., invalid ID/URL)
  METHOD_NOT_ALLOWED = 405, // ❌ HTTP method (GET, POST, etc.) not supported by this route
  CONFLICT = 409, // ❌ Conflict in request (e.g., email already exists)
  GONE = 410, // ❌ Resource is permanently gone (rarely used)
  PAYLOAD_TOO_LARGE = 413, // ❌ Request body too large (file uploads, etc.)
  UNSUPPORTED_MEDIA_TYPE = 415, // ❌ Invalid or unsupported content type (e.g., not JSON)
  UNPROCESSABLE_ENTITY = 422, // ❌ Semantically invalid data (e.g., validation passes schema but logic is wrong)
  TOO_MANY_REQUESTS = 429, // ❌ Rate limit exceeded (e.g., spam protection, brute force)

  // ─────────────────────────
  // 💥 5xx Server Errors
  // ─────────────────────────

  INTERNAL_SERVER_ERROR = 500, // 💥 Catch-all for unhandled server errors
  NOT_IMPLEMENTED = 501, // 💥 Functionality not supported yet
  BAD_GATEWAY = 502, // 💥 Invalid response from upstream server (e.g., microservice or third-party API)
  SERVICE_UNAVAILABLE = 503, // 💥 Server down or overloaded (use in maintenance mode too)
  GATEWAY_TIMEOUT = 504, // 💥 Timeout waiting for upstream service (e.g., DB, API delay)
}
