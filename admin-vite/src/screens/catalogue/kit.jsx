import { useState } from 'react';
import { api, errorMessage } from '@/lib/api';
import { Confirm, useToast, Badge } from '@/ui';

export const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://exploringwatamu-platform.vercel.app').replace(/\/$/, '');

/** Unwrap list endpoints that return either an array or { data: [] }. */
export const listOf = (res) => (Array.isArray(res.data) ? res.data : Array.isArray(res.data?.data) ? res.data.data : []);

/** Optimistic quick edit via PATCH /admin/quick/:resource/:id. Returns true on success. */
export function useQuick(resource) {
  const toast = useToast();
  return async (id, patch, list, message) => {
    list.update(id, patch);
    try {
      const res = await api.patch(`/admin/quick/${resource}/${id}`, patch);
      list.update(id, res.data);
      if (message) toast(message);
      return true;
    } catch (err) {
      toast(errorMessage(err, 'Couldn’t save that change.'), 'danger');
      list.reload();
      return false;
    }
  };
}

/** Delete with a confirm dialog. Usage: const del = useDelete(...); del.ask(row, list); render {del.dialog} */
export function useDelete({ endpoint, name, what = 'listing', warning }) {
  const toast = useToast();
  const [target, setTarget] = useState(null);
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    try {
      await api.delete(endpoint(target.row));
      target.list.remove(target.row._id);
      toast(`${name(target.row)} deleted`);
      setTarget(null);
    } catch (err) {
      toast(errorMessage(err, 'Couldn’t delete it.'), 'danger');
    }
    setBusy(false);
  };
  return {
    ask: (row, list) => setTarget({ row, list }),
    dialog: (
      <Confirm open={Boolean(target)} onOpenChange={(o) => !o && setTarget(null)} title={target ? `Delete ${name(target.row)}?` : ''} confirmLabel="Delete" tone="danger" onConfirm={run} loading={busy}>
        This permanently removes the {what}{warning ? ` ${warning}` : ''}. This can’t be undone.
      </Confirm>
    ),
  };
}

export const VIBE_LABEL = { ocean: 'Ocean', slow: 'Slow', adventure: 'Adventure', culture: 'Culture', romance: 'Romance', social: 'Social' };

export function TagSummary({ vibes }) {
  if (!vibes?.length) return <Badge tone="warn">No vibe tags</Badge>;
  return <span className="text-xs text-faint">{vibes.map((v) => VIBE_LABEL[v] || v).join(' · ')}</span>;
}
