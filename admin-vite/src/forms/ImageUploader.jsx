import { useEffect, useMemo, useRef, useState } from 'react';
import { ImagePlus, X, Star, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

// Must match backend/src/middleware/upload.js
const MAX_MB = 8;
const OK_TYPES = /^image\/(jpe?g|png|webp|heic|heif)$/i;

/*
 * Photos: existing URLs (already uploaded) + new File objects (uploaded on save).
 * Drag-and-drop or tap to pick (phones open the camera roll / camera).
 * The first photo is the cover. Existing and new photos keep separate order
 * because the API stores existing ones first, then appends new uploads.
 */
export default function ImageUploader({ existing = [], onExistingChange, files = [], onFilesChange, max = 10, single, label = 'Photos', hint, accept = 'image/*', docs }) {
  const input = useRef(null);
  const [over, setOver] = useState(false);
  const [problem, setProblem] = useState('');
  const previews = useMemo(() => files.map((f) => (docs ? null : URL.createObjectURL(f))), [files, docs]);
  useEffect(() => () => previews.forEach((u) => u && URL.revokeObjectURL(u)), [previews]);

  const total = existing.length + files.length;
  const room = single ? 1 : max - total;

  const take = (list) => {
    setProblem('');
    const incoming = Array.from(list || []);
    const bad = incoming.filter((f) => !docs && !OK_TYPES.test(f.type));
    const big = incoming.filter((f) => f.size > MAX_MB * 1024 * 1024);
    const good = incoming.filter((f) => !bad.includes(f) && !big.includes(f));
    if (bad.length) setProblem(`${bad.length} file${bad.length === 1 ? ' isn’t' : 's aren’t'} a supported photo (JPG, PNG, WebP or HEIC).`);
    else if (big.length) setProblem(`${big.length} file${big.length === 1 ? ' is' : 's are'} over ${MAX_MB} MB — please use a smaller photo.`);
    if (!good.length) return;
    if (single) {
      onExistingChange?.([]);
      onFilesChange([good[0]]);
      return;
    }
    if (good.length > room) setProblem(`Only ${max} ${docs ? 'files' : 'photos'} allowed — added the first ${Math.max(room, 0)}.`);
    onFilesChange([...files, ...good.slice(0, Math.max(room, 0))]);
  };

  const moveExisting = (i, d) => {
    const j = i + d;
    if (j < 0 || j >= existing.length) return;
    const next = [...existing];
    [next[i], next[j]] = [next[j], next[i]];
    onExistingChange(next);
  };
  const makeCover = (i) => onExistingChange([existing[i], ...existing.filter((_, n) => n !== i)]);

  const Tile = ({ src, name, onRemove, cover, controls }) => (
    <li className={cn('group relative overflow-hidden rounded-xl border border-line bg-subtle', single ? 'aspect-[16/9]' : 'aspect-square')}>
      {src ? <img src={src} alt="" className="size-full object-cover" /> : <span className="flex size-full flex-col items-center justify-center gap-1 p-2 text-center text-xs text-muted"><FileText className="size-6 text-faint" />{name}</span>}
      {cover && <span className="absolute left-1.5 top-1.5 rounded-full bg-ink/80 px-2 py-0.5 text-[0.65rem] font-semibold text-canvas">Cover</span>}
      <button type="button" onClick={onRemove} className="absolute right-1.5 top-1.5 rounded-full bg-ink/70 p-1 text-canvas hover:bg-danger" aria-label="Remove photo"><X className="size-3.5" /></button>
      {controls}
    </li>
  );

  return (
    <div>
      {total > 0 && (
        <ul className={cn('mb-3 grid gap-2', single ? 'grid-cols-1 sm:max-w-md' : 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-5')}>
          {existing.map((url, i) => (
            <Tile key={url} src={docs && !/\.(jpe?g|png|webp|gif|avif)(\?|$)/i.test(url) ? null : url} name={url.split('/').pop()} cover={!single && !docs && i === 0} onRemove={() => onExistingChange(existing.filter((_, n) => n !== i))}
              controls={!single && existing.length > 1 && (
                <div className="absolute inset-x-1.5 bottom-1.5 flex justify-between opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                  <button type="button" onClick={() => moveExisting(i, -1)} disabled={i === 0} className="rounded-full bg-ink/70 p-1 text-canvas disabled:opacity-30" aria-label="Move earlier"><ChevronLeft className="size-3.5" /></button>
                  {!docs && i !== 0 && <button type="button" onClick={() => makeCover(i)} className="rounded-full bg-ink/70 px-2 text-[0.65rem] font-semibold text-canvas" aria-label="Make cover photo"><Star className="inline size-3" /> Cover</button>}
                  <button type="button" onClick={() => moveExisting(i, 1)} disabled={i === existing.length - 1} className="rounded-full bg-ink/70 p-1 text-canvas disabled:opacity-30" aria-label="Move later"><ChevronRight className="size-3.5" /></button>
                </div>
              )} />
          ))}
          {files.map((f, i) => (
            <Tile key={`${f.name}-${i}`} src={previews[i]} name={f.name} cover={!single && !docs && existing.length === 0 && i === 0} onRemove={() => onFilesChange(files.filter((_, n) => n !== i))}
              controls={<span className="absolute inset-x-0 bottom-0 bg-brand/85 py-0.5 text-center text-[0.65rem] font-semibold text-brand-ink">New · uploads on save</span>} />
          ))}
        </ul>
      )}

      {(single || room > 0) && (
        <button
          type="button"
          onClick={() => input.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setOver(true); }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => { e.preventDefault(); setOver(false); take(e.dataTransfer.files); }}
          className={cn('flex w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors', over ? 'border-brand bg-brand-soft' : 'border-line hover:border-brand/60 hover:bg-subtle')}
        >
          <ImagePlus className="size-6 text-faint" />
          <span className="text-sm font-semibold text-ink">{single && total ? 'Replace' : 'Add'} {label.toLowerCase()}</span>
          <span className="text-xs text-faint">{hint || `Drag & drop or tap to choose · ${docs ? 'files' : 'JPG, PNG, WebP or HEIC'} · up to ${MAX_MB} MB${single ? '' : ` · ${room} left`}`}</span>
        </button>
      )}
      <input ref={input} type="file" accept={accept} multiple={!single} className="hidden" onChange={(e) => { take(e.target.files); e.target.value = ''; }} />
      {problem && <p className="mt-2 text-xs font-medium text-warn" role="status">{problem}</p>}
    </div>
  );
}
