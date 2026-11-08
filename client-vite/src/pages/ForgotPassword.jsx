import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { MailCheck } from 'lucide-react';
import { API_URL } from '@/api.js';
import AuthShell, { AuthField, AuthError, authInput } from '@/components/auth/AuthShell';
import { Button } from '@/components/ui/button';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await axios.post(`${API_URL}/auth/forgot-password`, { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  return (
    <AuthShell title="Reset your password" lede="Enter your email and we’ll send you a link to choose a new one." footer={<Link to="/login" className="font-semibold text-ocean-900 underline decoration-coral-400 underline-offset-4">Back to sign in</Link>}>
      {sent ? (
        <div className="rounded-[var(--radius-card)] border border-sand-200 bg-white p-6 text-center shadow-soft" role="status">
          <MailCheck className="mx-auto size-10 text-lagoon-600" />
          <p className="mt-3 text-ocean-900/75">
            If an account exists for <strong className="text-ocean-900">{email}</strong>, a reset link is on its way. Check your inbox and spam folder.
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <AuthError>{error}</AuthError>
          <AuthField label="Email">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className={authInput} />
          </AuthField>
          <Button type="submit" size="lg" className="w-full" disabled={loading}>{loading ? 'Sending…' : 'Send reset link'}</Button>
        </form>
      )}
    </AuthShell>
  );
}
