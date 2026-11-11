import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { Button, Field, Input, Sheet, Textarea } from '@/ui';
import { cn } from '@/lib/utils';
import { formatWhatsAppNumber, parseWhatsAppNumber, whatsappLink } from '@/lib/whatsapp';
import { REPLY_TEMPLATES, defaultReplyTemplate, tripReplyMessage } from '@/lib/tripReplies';

/** What the "To" field says about the number: [error, hint]. */
function numberCheck(parsed, raw, country) {
  if (!raw.trim()) return ['The traveller didn’t give a phone number. Add one to reply on WhatsApp.', null];
  if (!parsed) return ['WhatsApp needs the full international number with the country code, e.g. +44 7700 900123 or +254 712 345 678.', null];
  return [
    null,
    <>
      Opens a chat with <b className="text-ink">{formatWhatsAppNumber(parsed.digits)}</b>.
      {parsed.local && (
        <>
          {' '}No country code was given, so this assumes a Kenyan number
          {country ? <> — the traveller said they’re from <b className="text-ink">{country}</b></> : null}. Check it before you send.
        </>
      )}
    </>,
  ];
}

function ReplyForm({ request: r }) {
  const [phone, setPhone] = useState(r.contact?.phone || '');
  const [template, setTemplate] = useState(() => defaultReplyTemplate(r));
  const [message, setMessage] = useState(() => tripReplyMessage(r));
  const parsed = parseWhatsAppNumber(phone);
  const href = parsed && message.trim() ? whatsappLink(parsed.digits, message) : null;
  const [numberError, numberHint] = numberCheck(parsed, phone, r.contact?.country);

  const pick = (id) => {
    setTemplate(id);
    setMessage(tripReplyMessage(r, id));
  };

  return (
    <div className="space-y-4">
      <Field label="To" error={numberError} hint={numberHint}>
        <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="off" aria-invalid={!parsed} />
      </Field>
      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-ink">Start from</legend>
        <div className="flex flex-wrap gap-1.5">
          {REPLY_TEMPLATES.filter((t) => t.id !== 'quote' || r.quote?.total).map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={template === t.id}
              onClick={() => pick(t.id)}
              className={cn('rounded-full border px-3 py-1 text-xs font-semibold', template === t.id ? 'border-brand bg-brand-soft text-ink' : 'border-line text-muted hover:text-ink')}
            >
              {t.label}
            </button>
          ))}
        </div>
      </fieldset>
      <Field label="Message" hint="Edit anything before you open WhatsApp.">
        <Textarea rows={7} value={message} onChange={(e) => setMessage(e.target.value)} />
      </Field>
      {href ? (
        <Button href={href} target="_blank" rel="noopener noreferrer" variant="whatsapp" size="lg" className="w-full">
          <MessageCircle /> Open WhatsApp
        </Button>
      ) : (
        <Button variant="whatsapp" size="lg" className="w-full" disabled>
          <MessageCircle /> Open WhatsApp
        </Button>
      )}
      <p className="text-xs text-faint">WhatsApp opens with this message filled in. Nothing is sent until you press Send there.</p>
    </div>
  );
}

/** "Reply on WhatsApp" for a trip request: check the number, pick and edit a message, then open WhatsApp. */
export default function WhatsAppReply({ request, className }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="whatsapp" className={cn('w-full', className)} onClick={() => setOpen(true)}>
        <MessageCircle /> Reply on WhatsApp
      </Button>
      <Sheet open={open} onOpenChange={setOpen} title="Reply on WhatsApp" description={`${request.contact?.name || 'Traveller'} · ${request.reference}`}>
        {open && <ReplyForm request={request} />}
      </Sheet>
    </>
  );
}
