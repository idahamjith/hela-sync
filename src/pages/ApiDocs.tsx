import React from 'react';
import { Terminal, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ApiDocs() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 font-sans antialiased pb-12">
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/75 dark:bg-slate-900/75 border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link to="/" className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-500 hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                Developer API
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1">
                INTEGRATION DOCS
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 mt-8 md:mt-12">
        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Terminal className="w-4 h-4 text-orange-500" />
              Developer API Integration
            </h3>
            <p className="text-xs text-slate-500 mt-1">Integrate Sinhala conversions directly into your applications.</p>
          </div>
          <div className="p-6 bg-slate-50 dark:bg-slate-900/50">
            <div className="mb-8">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Endpoint</span>
              <div className="mt-2 flex items-center gap-3">
                <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 font-bold text-xs rounded uppercase">POST</span>
                <code className="text-sm font-mono font-bold text-slate-700 dark:text-slate-300">/api/convert</code>
              </div>
            </div>
            
            <div className="mb-8">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Request Body</span>
              <pre className="mt-2 text-xs font-mono bg-slate-800 text-slate-200 p-4 rounded-xl overflow-x-auto shadow-inner">
{`{
  "text": "amma",
  "mode": "auto", // "auto" | "singlish-to-unicode" | "legacy-to-unicode" | "unicode-to-legacy"
  "smartPostProcess": true, // Optional (default true)
  "activeFont": "fm-abhaya" // Optional, for legacy modes
}`}
              </pre>
            </div>
            
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Response</span>
              <pre className="mt-2 text-xs font-mono bg-slate-800 text-slate-200 p-4 rounded-xl overflow-x-auto shadow-inner">
{`{
  "result": "අම්මා",
  "confidence": 100,
  "mode": "singlish-to-unicode"
}`}
              </pre>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
