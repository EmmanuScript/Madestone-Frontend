// API Configuration
// Use environment variable if available, fallback to localhost for development
export const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000";

// A small, safe wrapper around fetch that:
// - Prefixes requests with API_BASE_URL
// - Adds JSON headers when body is an object
// - Parses JSON safely; if server returns HTML/text, returns a structured error
// - Throws a normalized error with status & message
export async function apiFetch(path, options = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
  const { headers = {}, body, ...rest } = options;

  let finalBody = body;
  const finalHeaders = { ...headers };

  if (body && typeof body === "object" && !(body instanceof FormData)) {
    finalHeaders["Content-Type"] = finalHeaders["Content-Type"] || "application/json";
    finalBody = JSON.stringify(body);
  }

  try {
    const res = await fetch(url, { headers: finalHeaders, body: finalBody, ...rest });

    const contentType = res.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");

    if (!res.ok) {
      let errPayload = null;
      try {
        errPayload = isJson ? await res.json() : await res.text();
      } catch (_) {
        errPayload = null;
      }

      const message =
        (errPayload && typeof errPayload === "object" && (errPayload.message || errPayload.error)) ||
        (typeof errPayload === "string" ? errPayload.slice(0, 200) : null) ||
        `Request failed with status ${res.status}`;

      const error = new Error(message);
      error.status = res.status;
      error.payload = errPayload;
      error.url = url;
      throw error;
    }

    if (isJson) {
      return await res.json();
    }
    // Fallback: if not JSON (e.g., HTML error page), return text
    return await res.text();
  } catch (err) {
    // Normalize network errors
    const error = new Error(err.message || "Network error");
    error.cause = err;
    error.url = url;
    throw error;
  }
}

// Helper to include auth token easily
export function withAuth(token) {
  return {
    Authorization: token ? `Bearer ${token}` : undefined,
  };
}
