import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { Alert, Button, Field, Input } from '@/ui';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const { login, loading, expired } = useAdminAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const res = await login(email.trim(), password);
    if (res.ok) navigate('/admin/dashboard', { replace: true });
    else setError(res.error);
  };

  return (
    <div className="grid min-h-dvh place-items-center bg-canvas px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <img src="/brand/logo-badge-192.png" alt="Exploring Watamu" className="size-16 rounded-full shadow-card" width="64" height="64" />
          <h1 className="mt-4 text-xl font-bold text-ink">Sign in to Admin</h1>
          <p className="mt-1 text-sm text-muted">Exploring Watamu team workspace</p>
        </div>
        <form onSubmit={submit} className="space-y-4 rounded-2xl border border-line bg-surface p-6 shadow-card">
          {expired && !error && <Alert tone="info">Your session expired. Please sign in again.</Alert>}
          {error && <Alert tone="danger">{error}</Alert>}
          <Field label="Email">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" autoFocus required inputMode="email" />
          </Field>
          <Field label="Password">
            <div className="relative">
              <Input type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required className="pr-11" />
              <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md p-2 text-faint hover:text-ink" aria-label={show ? 'Hide password' : 'Show password'}>
                {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </Field>
          <Button type="submit" size="lg" className="w-full" loading={loading}>Sign in</Button>
        </form>
        <p className="mt-6 text-center text-xs text-faint">Forgot your password? Ask a teammate to reset it from the Team page.</p>
      </div>
    </div>
  );
}
