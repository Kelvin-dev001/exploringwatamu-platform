// Normalizes an axios error for inline display in admin forms. The API answers
// { error, details?, issues?: [{ path, message }], field?, code? }.
export function parseApiError(err, fallback) {
  const response = err?.response;
  if (!response) {
    return {
      message: err?.request ? "Could not reach the server. Check your connection and try again." : fallback,
      details: err?.message,
      issues: [],
    };
  }
  const data = response.data && typeof response.data === "object" ? response.data : {};
  return {
    status: response.status,
    message: data.error || fallback,
    details: data.details,
    field: data.field,
    issues: Array.isArray(data.issues) ? data.issues : [],
  };
}

// The error for one form field: a validation issue on it (or nested inside it,
// e.g. "itinerary.0.title"), or an upload error naming it.
export function fieldError(error, name) {
  if (!error) return null;
  const issue = error.issues.find((i) => i.path === name || String(i.path).startsWith(`${name}.`));
  if (issue) return issue.message;
  return error.field === name ? error.message : null;
}
