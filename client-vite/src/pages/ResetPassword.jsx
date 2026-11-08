import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle2 } from 'lucide-react';
import { API_URL } from '@/api.js';
import AuthShell, { AuthField, AuthError, authInput } from '@/components/auth/AuthShell';
import { Button } from '@/components/ui/button';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirm) return setError('Passwords do not match.');
    setLoading(true);
    try {
      await axios.post(`${API_URL}/auth/reset-password`, { token, password });
      setDone(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(err.response?.data?.error || 'Reset failed. The link may have expired.');
    }
    setLoading(false);
  };

  return (
    <AuthShell title="Choose a new password" footer={<Link to="/login" className="font-semibold text-ocean-900 underline decoration-coral-400 underline-offset-4">Back to sign in</Link>}>
      {!token ? (
        <AuthError>
          This reset link is invalid or incomplete. <Link to="/forgot-password" className="underline">Request a new one</Link>.
        </AuthError>
      ) : done ? (
        <div className="rounded-[var(--radius-card)] border border-sand-200 bg-white p-6 text-center shadow-soft" role="status">
          <CheckCircle2 className="mx-auto size-10 text-mangrove-500" />
          <p className="mt-3 text-ocean-900/75">Password updated. Taking you to sign in…</p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <AuthError>{error}</AuthError>
          <AuthField label="New password" hint="At least 8 characters">
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" className={authInput} />
          </AuthField>
          <AuthField label="Confirm new password">
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required autoComplete="new-password" className={authInput} />
          </AuthField>
          <Button type="submit" size="lg" className="w-full" disabled={loading}>{loading ? 'Saving…' : 'Save new password'}</Button>
        </form>
      )}
    </AuthShell>
  );
}
