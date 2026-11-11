// After a deploy, a tab opened earlier asks for screen files that no longer
// exist. Reloading fixes it. The browsers' messages:
//   Chrome/Edge  "Failed to fetch dynamically imported module: …"
//   Firefox      "error loading dynamically imported module"
//   Safari       "Importing a module script failed."
const CHUNK_ERROR = /dynamically imported module|Importing a module script failed/i;

export const RELOADED_KEY = 'ew:reloaded-for-update';

export function isStaleBuildError(error) {
  return CHUNK_ERROR.test(String(error?.message || error || ''));
}
