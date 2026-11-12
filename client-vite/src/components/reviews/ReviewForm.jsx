import { useEffect, useId, useMemo, useState } from 'react';
import { Camera, Star, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PHOTOS_MAX, TEXT_MAX, TEXT_MIN, submitReview, uploadReviewPhotos } from '@/lib/reviews';
import { reviewError } from '@/lib/reviewErrors';
import { useI18n } from '@/i18n';
import messages from '@/locales/reviews';

// What each star means: message keys words1–words5.
const word = (t, n) => (n ? t(`words${n}`) : '');
const ACCEPT = 'image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif';
const MAX_MB = 8;

/** 1–5 stars as real radio buttons (arrow keys work, screen readers read "4 stars"). */
export function StarInput({ value, onChange, name }) {
  const { t } = useI18n(messages);
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold text-ocean-900">{t('yourRating')}</legend>
      <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className="cursor-pointer rounded-md p-0.5 focus-within:ring-2 focus-within:ring-coral-500" onMouseEnter={() => setHover(n)}>
            <input type="radio" name={name} value={n} checked={value === n} onChange={() => onChange(n)} className="sr-only" aria-label={t('stars', { count: n, word: word(t, n) })} />
            <Star aria-hidden="true" className={cn('size-8 transition', n <= shown ? 'fill-ochre-500 text-ochre-500' : 'fill-sand-100 text-sand-300')} />
          </label>
        ))}
        <span className="ml-2 text-sm text-ocean-900/65" aria-live="polite">
          {word(t, shown)}
        </span>
      </div>
    </fieldset>
  );
}

function PhotoPicker({ files, onChange, disabled }) {
  const { t } = useI18n(messages);
  const id = useId();
  const previews = useMemo(() => files.map((f) => (typeof URL !== 'undefined' && URL.createObjectURL ? URL.createObjectURL(f) : '')), [files]);
  useEffect(() => () => previews.forEach((u) => u && URL.revokeObjectURL?.(u)), [previews]);
  const [problem, setProblem] = useState('');

  const add = (list) => {
    const picked = [...list];
    const tooBig = picked.filter((f) => f.size > MAX_MB * 1024 * 1024);
    const ok = picked.filter((f) => f.size <= MAX_MB * 1024 * 1024);
    const next = [...files, ...ok].slice(0, PHOTOS_MAX);
    setProblem(tooBig.length ? t('tooBig', { names: tooBig.map((f) => f.name).join(', '), mb: MAX_MB }) : files.length + ok.length > PHOTOS_MAX ? t('tooMany', { max: PHOTOS_MAX }) : '');
    onChange(next);
  };

  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-ocean-900">
        {t('photos')} <span className="font-normal text-ocean-900/60">{t('photosOptional', { max: PHOTOS_MAX })}</span>
      </p>
      <div className="flex flex-wrap gap-2">
        {files.map((f, i) => (
          <div key={`${f.name}-${i}`} className="relative">
            {previews[i] ? <img src={previews[i]} alt={t('photoAlt', { n: i + 1, name: f.name })} className="size-20 rounded-xl object-cover" /> : <span className="block size-20 rounded-xl bg-sand-100" />}
            <button type="button" onClick={() => onChange(files.filter((_, n) => n !== i))} disabled={disabled} aria-label={t('removePhoto', { n: i + 1 })} className="absolute -right-2 -top-2 grid size-6 place-items-center rounded-full bg-ocean-900 text-sand-50">
              <X className="size-3.5" />
            </button>
          </div>
        ))}
        {files.length < PHOTOS_MAX && (
          <label htmlFor={id} className={cn('grid size-20 cursor-pointer place-items-center rounded-xl border border-dashed border-sand-300 text-ocean-900/60 hover:border-ocean-900/40', disabled && 'pointer-events-none opacity-50')}>
            <Camera className="size-6" aria-hidden="true" />
            <span className="sr-only">{t('addPhotos')}</span>
          </label>
        )}
        <input id={id} type="file" accept={ACCEPT} multiple className="sr-only" disabled={disabled} onChange={(e) => { add(e.target.files || []); e.target.value = ''; }} />
      </div>
      {problem && <p className="mt-2 text-sm text-coral-700">{problem}</p>}
    </div>
  );
}

/**
 * Write a review of one listing from one booking. The review is sent first;
 * photos follow. If the photos fail, the review is still in — the traveller
 * can try the photos again.
 */
export default function ReviewForm({ item, token, inviteToken, onDone }) {
  const { t } = useI18n(messages);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(null); // the created review, when photos are still to go
  const textId = useId();

  const length = text.trim().length;
  const ready = rating > 0 && length >= TEXT_MIN && length <= TEXT_MAX;

  const sendPhotos = async (review) => {
    if (!files.length) return onDone(review);
    try {
      const withPhotos = await uploadReviewPhotos(token, review._id, files);
      onDone(withPhotos);
    } catch (err) {
      setSent(review);
      setError(t('photosFailed', { reason: reviewError(err) }));
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!ready || busy) return;
    setBusy(true);
    setError('');
    try {
      if (sent) await sendPhotos(sent);
      else {
        const review = await submitReview(token, {
          listingType: item.listingType,
          listingId: item.listingId,
          bookingType: item.booking.type,
          bookingId: item.booking.id,
          rating,
          text: text.trim(),
          ...(inviteToken ? { inviteToken } : {}),
        });
        await sendPhotos(review);
      }
    } catch (err) {
      setError(reviewError(err));
    }
    setBusy(false);
  };

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      {!sent && <StarInput name={`rating-${item.listingType}-${item.listingId}`} value={rating} onChange={setRating} />}
      {!sent && (
        <div>
          <label htmlFor={textId} className="mb-1.5 block text-sm font-semibold text-ocean-900">
            {t('yourReview')}
          </label>
          <textarea
            id={textId}
            rows={5}
            value={text}
            maxLength={TEXT_MAX}
            onChange={(e) => setText(e.target.value)}
            placeholder={t('placeholder')}
            aria-describedby={`${textId}-count`}
            className="w-full rounded-2xl border border-sand-300 bg-white p-4 text-ocean-900"
          />
          <p id={`${textId}-count`} className={cn('mt-1 text-xs', length > 0 && length < TEXT_MIN ? 'text-coral-700' : 'text-ocean-900/60')}>
            {length < TEXT_MIN ? t('atLeast', { min: TEXT_MIN, count: length }) : t('counter', { count: length, max: TEXT_MAX })}
          </p>
        </div>
      )}
      <PhotoPicker files={files} onChange={setFiles} disabled={busy} />
      {error && (
        <p role="alert" className="rounded-xl bg-coral-50 p-3 text-sm font-semibold text-coral-700">
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={!ready || busy}>
          {busy ? t('sending') : sent ? t('retryPhotos') : t('send')}
        </Button>
        {sent && (
          <Button variant="ghost" onClick={() => onDone(sent)}>
            {t('skipPhotos')}
          </Button>
        )}
      </div>
      <p className="text-xs text-ocean-900/60">{t('readFirst')}</p>
    </form>
  );
}
