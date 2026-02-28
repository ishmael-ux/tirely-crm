'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { setApiKey, apiGet } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      setApiKey(key);
      await apiGet('/api/stats');
      router.push('/');
    } catch {
      setError('Invalid access key. Please try again.');
      setApiKey('');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-2xl p-10 w-full max-w-sm shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
        <div className="font-serif text-2xl mb-1.5">TreadCRM</div>
        <p className="text-text3 text-[13px] mb-6">Enter your access key to continue</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            value={key}
            onChange={e => setKey(e.target.value)}
            placeholder="Access key"
            autoFocus
            className="w-full px-3 py-2.5 border border-border rounded-[7px] text-[13px] font-sans text-foreground bg-surface outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(200,75,47,0.08)] transition-all"
          />

          {error && <p className="text-brand text-[12px]">{error}</p>}

          <button
            type="submit"
            disabled={loading || !key}
            className="w-full py-2.5 bg-brand text-white rounded-[7px] text-[13px] font-medium hover:bg-[#b33f25] disabled:opacity-50 transition-colors"
          >
            {loading ? 'Verifying…' : 'Continue'}
          </button>
        </form>

        <p className="text-text3 text-[11px] mt-5 text-center">
          Tire Shop Management System
        </p>
      </div>
    </div>
  );
}
