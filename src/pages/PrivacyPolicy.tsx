import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Eye, Database, Cookie, Mail, RefreshCw, Globe, ChevronDown } from 'lucide-react';

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

function Section({ icon, title, children }: SectionProps) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden mb-4">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-left"
      >
        <span className="flex items-center gap-3 font-semibold text-slate-800 dark:text-slate-100 text-sm">
          <span className="text-orange-500">{icon}</span>
          {title}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="px-6 py-5 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-400 leading-relaxed space-y-3">
          {children}
        </div>
      )}
    </div>
  );
}

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 font-sans antialiased pb-16">

      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/75 dark:bg-slate-900/75 border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              to="/"
              className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-500 hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-800 dark:text-slate-100">
                Privacy Policy
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono uppercase tracking-wider">
                HēlaSync · helasync.site
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
            <RefreshCw className="w-3 h-3" />
            Last updated: June 2025
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 mt-8 md:mt-12">

        {/* Hero banner */}
        <div className="relative rounded-3xl overflow-hidden mb-8 bg-gradient-to-br from-orange-500 to-orange-600 p-8 shadow-lg shadow-orange-200 dark:shadow-orange-900/30">
          <div className="absolute inset-0 opacity-10"
            style={{backgroundImage: 'radial-gradient(circle at 70% 30%, #fff 1px, transparent 1px), radial-gradient(circle at 20% 80%, #fff 1px, transparent 1px)', backgroundSize: '40px 40px'}}
          />
          <Shield className="w-10 h-10 text-white/80 mb-3" />
          <h2 className="text-2xl font-bold text-white mb-2">Your privacy matters.</h2>
          <p className="text-orange-100 text-sm leading-relaxed max-w-xl">
            Helasync is a free, offline-first Sinhala conversion tool. This policy explains what limited data
            is collected through analytics and how it is used.
          </p>
        </div>

        {/* Sections */}
        <Section icon={<Eye className="w-4 h-4" />} title="What We Collect">
          <p>
            Helasync does <strong className="text-slate-800 dark:text-slate-200">not</strong> collect, store, or transmit any text you type into the converter.
            All conversions happen entirely in your browser.
          </p>
          <p>
            We use <strong className="text-slate-800 dark:text-slate-200">Google Analytics</strong> to collect anonymous usage data, including:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-1">
            <li>Pages visited and time spent on the site</li>
            <li>General geographic region (country/city level)</li>
            <li>Device type, browser, and operating system</li>
            <li>Referring website or source</li>
          </ul>
          <p>
            This data is aggregated and anonymised. We cannot identify you personally from this data.
          </p>
        </Section>

        <Section icon={<Cookie className="w-4 h-4" />} title="Cookies & Local Storage">
          <p>
            Google Analytics places cookies in your browser to distinguish unique visitors and sessions. These cookies do not contain personal information.
          </p>
          <p>
            Helasync also uses your browser's <strong className="text-slate-800 dark:text-slate-200">localStorage</strong> to remember your preferences (e.g. dark/light mode, last-used conversion mode). This data stays on your device and is never sent to any server.
          </p>
          <p>
            You can clear localStorage and cookies at any time through your browser settings.
          </p>
        </Section>

        <Section icon={<Database className="w-4 h-4" />} title="How We Use Your Data">
          <p>Analytics data is used solely to:</p>
          <ul className="list-disc list-inside space-y-1 pl-1">
            <li>Understand which features are most used</li>
            <li>Improve the performance and usability of the site</li>
            <li>Identify and fix errors or broken experiences</li>
          </ul>
          <p>
            We do <strong className="text-slate-800 dark:text-slate-200">not</strong> sell, share, or rent any data to third parties. We do not use data for advertising.
          </p>
        </Section>

        <Section icon={<Globe className="w-4 h-4" />} title="Third-Party Services">
          <p>
            Helasync uses <strong className="text-slate-800 dark:text-slate-200">Google Analytics</strong> (provided by Google LLC). Google may process data on servers outside Sri Lanka.
            Google's own privacy policy applies to data it collects:
          </p>
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-orange-500 hover:text-orange-600 font-medium underline underline-offset-2"
          >
            policies.google.com/privacy ↗
          </a>
          <p className="mt-2">
            You can opt out of Google Analytics tracking using the{' '}
            <a
              href="https://tools.google.com/dlpage/gaoptout"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-500 hover:text-orange-600 underline underline-offset-2"
            >
              Google Analytics Opt-out Browser Add-on ↗
            </a>.
          </p>
        </Section>

        <Section icon={<Shield className="w-4 h-4" />} title="Children's Privacy">
          <p>
            Helasync is a general-purpose tool open to all ages. We do not knowingly collect personal information from children under 13. Since no personal data is collected at all, this tool is safe for use by students and children.
          </p>
        </Section>

        <Section icon={<RefreshCw className="w-4 h-4" />} title="Changes to This Policy">
          <p>
            This policy may be updated from time to time. The "Last updated" date at the top of this page will reflect any changes. Continued use of Helasync after changes constitutes acceptance of the updated policy.
          </p>
        </Section>

        <Section icon={<Mail className="w-4 h-4" />} title="Contact">
          <p>If you have any questions about this privacy policy, please contact:</p>
          <div className="mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-1">
            <p className="font-semibold text-slate-800 dark:text-slate-200">Induwara Dahamjith</p>
            <a
              href="mailto:induwaradahamjith2004@gmail.com"
              className="text-orange-500 hover:text-orange-600 underline underline-offset-2"
            >
              induwaradahamjith2004@gmail.com
            </a>
          </div>
        </Section>

        {/* Footer note */}
        <p className="text-center text-xs text-slate-400 dark:text-slate-600 mt-8">
          © {new Date().getFullYear()} Helasync · Induwara Dahamjith · All rights reserved
        </p>
      </main>
    </div>
  );
}