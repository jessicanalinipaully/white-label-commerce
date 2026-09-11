'use client';

import { useState } from 'react';

export default function Home() {
  const [apiResponse, setApiResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testApi = async () => {
    setLoading(true);
    setError(null);
    setApiResponse(null);

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

    try {
      const response = await fetch(`${baseUrl}/health`);
      if (!response.ok) {
        throw new Error(`HTTP Error status: ${response.status}`);
      }
      const data = await response.json();
      setApiResponse(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setError(err.message || 'Failed to connect to API');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-950 text-slate-100">
      <div className="max-w-xl w-full p-8 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-2xl backdrop-blur-md">
        <div className="flex items-center space-x-3 mb-6">
          <div className="h-4 w-4 rounded-full bg-indigo-500 animate-pulse"></div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
            Phase 1 Foundation
          </span>
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
          White Label Commerce Platform
        </h1>
        <p className="text-slate-400 text-sm mb-8">
          Production-grade monorepo setup running Next.js App Router & NestJS backend.
        </p>

        <div className="space-y-4">
          <button
            id="test-api-btn"
            onClick={testApi}
            disabled={loading}
            className="w-full py-3 px-6 rounded-xl font-medium text-sm text-white bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] transition-all disabled:opacity-50 shadow-lg shadow-indigo-600/20"
          >
            {loading ? 'Connecting...' : 'Test API'}
          </button>

          {error && (
            <div className="p-4 rounded-xl bg-red-950/50 border border-red-800/50 text-red-300 text-sm">
              <p className="font-semibold mb-1">API Connection Error</p>
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          {apiResponse && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-medium text-emerald-400 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                  API Response 200 OK
                </span>
              </div>
              <pre className="text-xs font-mono text-slate-300 overflow-x-auto p-2 bg-slate-900 rounded border border-slate-800">
                {apiResponse}
              </pre>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
