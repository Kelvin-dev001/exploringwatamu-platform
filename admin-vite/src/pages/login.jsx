import React, { useState } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext'; // create this context!

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAdminAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      // TODO: redirect to admin dashboard using your routing logic
    } catch (err) {
      setError(err.message || 'Login failed');
    }
  };

  return (
    <div style={styles.form}>
      <h2 style={styles.title}>Admin Login</h2>
      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={styles.input}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={styles.input}
        />
        {error && <div style={styles.error}>{error}</div>}
        <button type="submit" style={styles.button}>Log In</button>
      </form>
    </div>
  );
}

const styles = {
  form: { padding: 30, marginTop: 80, maxWidth: 320, marginLeft: 'auto', marginRight: 'auto' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 18 },
  input: { width: '100%', borderWidth: 1, borderColor: '#ccc', borderRadius: 7, padding: 10, marginBottom: 12 },
  button: { width: '100%', backgroundColor: '#24b3b3', borderRadius: 7, padding: 14, color: '#fff', fontWeight: 'bold', fontSize: 16, border: 'none', cursor: 'pointer' },
  error: { color: '#ff5e5e', marginBottom: 8 },
};