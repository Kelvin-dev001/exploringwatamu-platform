/*
 * Optional Italian text for a listing: field names and limits match
 * backend/src/constants/italianContent.js. Used by forms/ItalianFields.jsx.
 */
export const ITALIAN = {
  titleIt: { label: 'Italian title', max: 200, rows: 0 },
  shortDescriptionIt: { label: 'Italian short description', max: 1000, rows: 2 },
  descriptionIt: { label: 'Italian description', max: 20000, rows: 5 },
};

export const emptyItalian = (fields) => Object.fromEntries(fields.map((f) => [f, '']));
export const italianFrom = (doc = {}, fields) => Object.fromEntries(fields.map((f) => [f, doc[f] || '']));

/** Into FormData — always sent, so clearing a field clears it on the website too. */
export function appendItalian(fd, values, fields) {
  fields.forEach((f) => fd.append(f, values[f] ?? ''));
}

/** For the JSON forms (transfers, car hire). */
export const italianBody = (values, fields) => Object.fromEntries(fields.map((f) => [f, values[f] ?? '']));

/** Problems for fields over their limit (the API refuses them too). */
export function italianProblems(values, fields) {
  const p = {};
  fields.forEach((f) => {
    if ((values[f] || '').length > ITALIAN[f].max) p[f] = `${ITALIAN[f].label} can be at most ${ITALIAN[f].max.toLocaleString('en-KE')} characters`;
  });
  return p;
}
