import { Field, Input, Textarea } from '@/ui';
import { Section } from './kit';
import { ITALIAN } from './italian';

/*
 * Optional Italian text for a listing (the website's Italian pages, /it/…).
 * Nothing is required: a blank field shows the English text instead.
 */
/**
 * "Italian (optional)" section. `english` maps each field to its English
 * counterpart's text so the placeholder shows what it is translating.
 * hasPage: the listing has its own page (experiences, group trips).
 */
export default function ItalianFields({ form, set, fields, errors = {}, english = {}, hasPage = false }) {
  const hasMain = Boolean((form.descriptionIt || '').trim() || (form.shortDescriptionIt || '').trim());
  return (
    <Section
      title="Italian (optional)"
      description="For the Italian website. Leave a field blank and the English text is shown there instead. Write it yourself or have an Italian speaker check it — the website never translates listings automatically."
    >
      {fields.map((f) => {
        const { label, rows } = ITALIAN[f];
        const placeholder = english[f] ? `English: ${String(english[f]).slice(0, 120)}${String(english[f]).length > 120 ? '…' : ''}` : undefined;
        return (
          <Field key={f} label={label} error={errors[f]}>
            {rows ? (
              <Textarea lang="it" rows={rows} value={form[f] || ''} onChange={(e) => set(f, e.target.value)} placeholder={placeholder} />
            ) : (
              <Input lang="it" value={form[f] || ''} onChange={(e) => set(f, e.target.value)} placeholder={placeholder} />
            )}
          </Field>
        );
      })}
      {/* Only experiences and group trips have their own page (and so an Italian one in search). */}
      {hasPage && (
        <p className="text-xs text-muted">
          {hasMain
            ? 'With an Italian description, this listing gets its own Italian page in search results.'
            : 'Without an Italian description, the Italian page shows the English text and search engines are pointed to the English page.'}
        </p>
      )}
    </Section>
  );
}
