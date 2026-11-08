import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, KeyRound, Trash2, Pencil, Copy, Wand2, UsersRound, ShieldCheck } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { ago, isEmail } from '@/lib/utils';
import { Alert, Badge, Button, Card, Confirm, Empty, Field, Input, PageHeader, Sheet, Skeleton, useToast } from '@/ui';

/** Readable strong password, e.g. "reef-dhow-mango-4821". */
function generatePassword() {
  const words = ['reef', 'dhow', 'mango', 'creek', 'baobab', 'coral', 'tide', 'sunset', 'palm', 'turtle', 'kite', 'sand', 'lagoon', 'mida', 'gede'];
  const pick = () => words[crypto.getRandomValues(new Uint32Array(1))[0] % words.length];
  const n = 1000 + (crypto.getRandomValues(new Uint32Array(1))[0] % 9000);
  return `${pick()}-${pick()}-${pick()}-${n}`;
}

function PasswordField({ value, onChange, label = 'Password' }) {
  const toast = useToast();
  return (
    <Field label={label} hint="At least 10 characters. Share it privately — they can change it later.">
      <div className="flex gap-2">
        <Input value={value} onChange={(e) => onChange(e.target.value)} autoComplete="new-password" className="font-mono" />
        <Button variant="secondary" size="icon" onClick={() => onChange(generatePassword())} aria-label="Generate a password" title="Generate"><Wand2 /></Button>
        <Button variant="secondary" size="icon" disabled={!value} onClick={() => navigator.clipboard.writeText(value).then(() => toast('Password copied'))} aria-label="Copy password" title="Copy"><Copy /></Button>
      </div>
    </Field>
  );
}

export default function Team() {
  const { admin, setAdmin, logout } = useAdminAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [team, setTeam] = useState(null);
  const [error, setError] = useState('');
  const [sheet, setSheet] = useState(null); // { kind: 'add'|'password'|'name', member? }
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState(null);

  const load = useCallback(() => {
    api.get('/admin/team').then((r) => setTeam(r.data)).catch((err) => setError(errorMessage(err, 'Couldn’t load the team.')));
  }, []);
  useEffect(() => {
    document.title = 'Team · Admin';
    load();
  }, [load]);

  const open = (kind, member) => {
    setFormError('');
    setForm({ name: member?.name || '', email: '', password: kind === 'name' ? '' : generatePassword() });
    setSheet({ kind, member });
  };

  const submit = async () => {
    setFormError('');
    if (sheet.kind === 'add' && !isEmail(form.email)) return setFormError('Enter a valid email address.');
    if (sheet.kind !== 'name' && form.password.length < 10) return setFormError('Password must be at least 10 characters.');
    setBusy(true);
    try {
      if (sheet.kind === 'add') {
        await api.post('/admin/team', { email: form.email.trim(), name: form.name.trim() || undefined, password: form.password });
        toast(`${form.name || form.email} can now sign in`);
      } else if (sheet.kind === 'password') {
        await api.put(`/admin/team/${sheet.member.id}/password`, { password: form.password });
        toast(`Password updated for ${sheet.member.name || sheet.member.email}`);
      } else {
        const res = await api.put(`/admin/team/${sheet.member.id}/name`, { name: form.name.trim() });
        if (res.data.isYou) {
          const next = { ...admin, name: res.data.name };
          setAdmin(next);
          localStorage.setItem('admin', JSON.stringify(next));
        }
        toast('Name updated');
      }
      setSheet(null);
      load();
    } catch (err) {
      setFormError(errorMessage(err));
    }
    setBusy(false);
  };

  const remove = async () => {
    setBusy(true);
    try {
      const res = await api.delete(`/admin/team/${removing.id}`);
      setRemoving(null);
      if (res.data.removedYourself) {
        logout();
        navigate('/admin/login');
        return;
      }
      toast(`${removing.name || removing.email} removed`);
      load();
    } catch (err) {
      toast(errorMessage(err), 'danger');
      setRemoving(null);
    }
    setBusy(false);
  };

  const title = { add: 'Add a teammate', password: 'Set a new password', name: 'Change name' }[sheet?.kind];

  return (
    <>
      <PageHeader
        title="Team"
        description="Everyone here is a full admin and can manage bookings, listings and the team."
        actions={<Button onClick={() => open('add')}><UserPlus />Add teammate</Button>}
      />
      {error && <Alert className="mb-4">{error}</Alert>}

      <Card className="overflow-hidden">
        {!team ? (
          <div className="space-y-3 p-5">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-14" />)}</div>
        ) : team.length === 0 ? (
          <Empty icon={UsersRound} title="No admins found" />
        ) : (
          <ul className="divide-y divide-line">
            {team.map((m) => (
              <li key={m.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:px-5">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-soft font-bold text-brand">{(m.name || m.email)[0].toUpperCase()}</span>
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 truncate font-semibold text-ink">{m.name || m.email.split('@')[0]}{m.isYou && <Badge tone="brand">You</Badge>}</p>
                    <p className="truncate text-sm text-muted">{m.email}</p>
                    <p className="text-xs text-faint">{m.lastLoginAt ? `Last signed in ${ago(m.lastLoginAt)}` : 'Hasn’t signed in yet'}{m.createdBy ? ` · added by ${m.createdBy}` : ''}</p>
                  </div>
                </div>
                <div className="flex gap-1 sm:shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => open('name', m)}><Pencil />Rename</Button>
                  <Button variant="ghost" size="sm" onClick={() => open('password', m)}><KeyRound />Password</Button>
                  <Button variant="danger-ghost" size="sm" disabled={team.length <= 1} title={team.length <= 1 ? 'You can’t remove the last admin' : undefined} onClick={() => setRemoving(m)}><Trash2 />Remove</Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <p className="mt-4 flex items-start gap-2 text-xs text-faint">
        <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
        If an admin is also set in Render as BOOTSTRAP_ADMIN_EMAIL, the server resets that admin’s password to the Render value on every restart — change it there too.
      </p>

      <Sheet
        open={Boolean(sheet)}
        onOpenChange={(o) => !o && setSheet(null)}
        title={title}
        description={sheet?.member ? sheet.member.email : 'They’ll be a full admin.'}
        footer={<div className="flex gap-2"><Button variant="secondary" className="flex-1" onClick={() => setSheet(null)}>Cancel</Button><Button className="flex-1" loading={busy} onClick={submit}>{sheet?.kind === 'add' ? 'Add teammate' : 'Save'}</Button></div>}
      >
        <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-4">
          {formError && <Alert>{formError}</Alert>}
          {sheet?.kind !== 'password' && <Field label="Name"><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Amina" autoComplete="off" /></Field>}
          {sheet?.kind === 'add' && <Field label="Email"><Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} autoComplete="off" inputMode="email" /></Field>}
          {sheet?.kind !== 'name' && <PasswordField value={form.password} onChange={(password) => setForm((f) => ({ ...f, password }))} label={sheet?.kind === 'add' ? 'Temporary password' : 'New password'} />}
          <button type="submit" className="hidden" />
        </form>
      </Sheet>

      <Confirm
        open={Boolean(removing)}
        onOpenChange={(o) => !o && setRemoving(null)}
        title={removing?.isYou ? 'Remove yourself?' : `Remove ${removing?.name || removing?.email}?`}
        confirmLabel="Remove"
        tone="danger"
        onConfirm={remove}
        loading={busy}
      >
        {removing?.isYou ? 'You’ll be signed out immediately and won’t be able to sign back in.' : 'They’ll lose access to the admin portal. Their past actions stay in the history.'}
      </Confirm>
    </>
  );
}
