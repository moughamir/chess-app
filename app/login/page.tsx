'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push(from);
        router.refresh();
      } else {
        setError('Invalid password');
      }
    } catch {
      setError('Connection error');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{
      background: '#18181b',
      padding: '2rem',
      borderRadius: '12px',
      border: '1px solid #27272a',
      width: '100%',
      maxWidth: '320px',
    }}>
      <h1 style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '1.25rem' }}>
        ♟️ Chess Assistant PRO
      </h1>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter password"
        autoFocus
        style={{
          width: '100%',
          padding: '0.75rem',
          borderRadius: '8px',
          border: '1px solid #3f3f46',
          background: '#27272a',
          color: '#e4e4e7',
          fontSize: '1rem',
          marginBottom: '1rem',
          boxSizing: 'border-box',
        }}
      />
      {error && (
        <div style={{ color: '#f43f5e', marginBottom: '1rem', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}
      <button
        type="submit"
        style={{
          width: '100%',
          padding: '0.75rem',
          borderRadius: '8px',
          border: 'none',
          background: '#e11d48',
          color: 'white',
          fontSize: '1rem',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Enter
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0a0a0b',
      color: '#e4e4e7',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
