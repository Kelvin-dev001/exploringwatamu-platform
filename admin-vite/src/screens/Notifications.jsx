import { Bell, Mail, MessageSquare } from 'lucide-react';
import { api } from '@/lib/api';
import { ago, cn } from '@/lib/utils';
import { Alert, StatusBadge } from '@/ui';
import DataView, { useRows } from '@/ui/DataView';

const EVENT = (e) => (e || '').replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());

export default function Notifications() {
  const list = useRows(async () => (await api.get('/notifications', { params: { limit: 100 } })).data.data || []);
  const failed = (list.rows || []).filter((n) => n.status === 'failed').length;
  const skipped = (list.rows || []).filter((n) => n.status === 'skipped').length;
  return (
    <>
      {failed > 0 && <Alert className="mb-4" title={`${failed} message${failed === 1 ? '' : 's'} failed`}>Usually SMTP or Africa’s Talking settings on Render. Open one to see the error.</Alert>}
      {!failed && skipped > 0 && <Alert tone="warn" className="mb-4" title="Some messages were skipped">Skipped means email (SMTP) or SMS isn’t configured on the server yet, so nothing was sent.</Alert>}
      <DataView
        title="Emails & SMS"
        description="The last 100 messages the platform tried to send."
        {...list}
        search={(n) => `${n.to} ${n.subject || ''} ${n.event || ''} ${n.error || ''}`}
        searchPlaceholder="Search recipient, subject or error"
        filters={[
          { key: 'channel', label: 'Channel', options: [{ value: 'email', label: 'Email' }, { value: 'sms', label: 'SMS' }], test: (n, v) => n.channel === v },
          { key: 'status', label: 'Status', options: ['sent', 'failed', 'skipped'].map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) })), test: (n, v) => n.status === v },
        ]}
        defaultSort={{ key: 'when', dir: 'desc' }}
        empty={{ icon: Bell, title: 'Nothing sent yet' }}
        columns={[
          {
            key: 'to', header: 'To', sort: (n) => n.to,
            cell: (n) => (
              <div className="flex min-w-0 items-center gap-2.5">
                {n.channel === 'sms' ? <MessageSquare className="size-4 shrink-0 text-faint" /> : <Mail className="size-4 shrink-0 text-faint" />}
                <span className="truncate text-sm text-ink">{n.to}</span>
              </div>
            ),
          },
          { key: 'what', header: 'Message', sort: (n) => n.event || '', cell: (n) => <div className="min-w-0"><p className="truncate text-sm text-ink">{n.subject || EVENT(n.event)}</p>{n.error && <p className="truncate text-xs text-danger" title={n.error}>{n.error}</p>}</div> },
          { key: 'status', header: 'Status', sort: (n) => n.status, cell: (n) => <StatusBadge status={n.status} /> },
          { key: 'when', header: 'When', sort: (n) => new Date(n.createdAt).getTime(), cell: (n) => <span className="whitespace-nowrap text-xs text-faint">{ago(n.createdAt)}</span> },
        ]}
        card={(n) => (
          <div className="flex items-start gap-3">
            {n.channel === 'sms' ? <MessageSquare className="mt-0.5 size-4 shrink-0 text-faint" /> : <Mail className="mt-0.5 size-4 shrink-0 text-faint" />}
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2"><p className="truncate text-sm font-medium text-ink">{n.to}</p><StatusBadge status={n.status} /></div>
              <p className="truncate text-sm text-muted">{n.subject || EVENT(n.event)}</p>
              {n.error && <p className={cn('text-xs text-danger')}>{n.error}</p>}
              <p className="text-xs text-faint">{ago(n.createdAt)}</p>
            </div>
          </div>
        )}
      />
    </>
  );
}
