import React from "react";
import Alert from "./Alert";
import { fieldError } from "../apiError.js";

// Inline summary of a failed submit: message, HTTP status, details and every
// validation issue (see parseApiError).
export default function FormError({ error }) {
  if (!error) return null;
  return (
    <Alert type="error">
      <div role="alert" className="flex flex-col items-start gap-1">
        <span className="font-semibold">
          {error.message}
          {error.status ? ` (HTTP ${error.status})` : ""}
        </span>
        {error.details && <span className="text-sm break-all">{error.details}</span>}
        {error.issues.length > 0 && (
          <ul className="list-disc ml-5 text-sm">
            {error.issues.map((issue, i) => (
              <li key={i}>
                {issue.message}
                {String(issue.path).includes(".") ? ` (${issue.path})` : ""}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Alert>
  );
}

// The message for a single field, shown under its input.
export function FieldError({ error, name }) {
  const message = fieldError(error, name);
  return message ? <p className="text-error text-sm mt-1">{message}</p> : null;
}
