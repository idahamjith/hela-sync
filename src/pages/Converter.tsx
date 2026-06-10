/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import * as mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { Link } from 'react-router-dom';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

import {
  Keyboard,
  Clipboard,
  Check,
  Sun,
  Moon,
  Trash2,
  ArrowLeftRight,
  ArrowRight,
  ArrowDown,
  Lock,
  HelpCircle,
  RefreshCw,
  FileDown,
  BookOpen,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Laptop,
  Minus,
  Plus,
  Settings2,
  Share2,
  History,
  Terminal,
  Hash
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  singlishToUnicode,
  legacyToUnicode,
  unicodeToLegacy,
  detectEncoding,
  smartPostProcess,
  ConversionMode,
  LegacyFontType
} from '../utils/converter';
import { WijesekaraKeyboard } from '../components/WijesekaraKeyboard';


type ThemeMode = 'light' | 'dark' | 'system';

interface HistoryItem {
  id: string;
  timestamp: number;
  input: string;
  output: string;
  mode: string;
}

export default function Converter() {
  // State variables
  const [inputText, setInputText] = useState<string>('');
  const [outputText, setOutputText] = useState<string>('');
  const [mode, setMode] = useState<ConversionMode | 'auto'>('auto');
  const [activeFont, setActiveFont] = useState<LegacyFontType>('fm-abhaya');
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const [copied, setCopied] = useState<boolean>(false);
  const [showKeymap, setShowKeymap] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'consonants' | 'vowels' | 'legacy'>('consonants');
  const [typingStats, setTypingStats] = useState({ charCount: 0, wordCount: 0 });
  const [outputFont, setOutputFont] = useState<'noto' | 'abhaya'>('noto');
  const [confidenceScore, setConfidenceScore] = useState<number | null>(null);
  const [isPostProcessing, setIsPostProcessing] = useState<boolean>(true);
  const [showKeyboard, setShowKeyboard] = useState<boolean>(false);
  const [showTypographyConfig, setShowTypographyConfig] = useState<boolean>(false);
  const [fontSize, setFontSize] = useState<number>(18);
  const [lineHeight, setLineHeight] = useState<number>(1.8);

  // New features state
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [inspectMode, setInspectMode] = useState<boolean>(false);
  const [shareCopied, setShareCopied] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // File Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const extension = file.name.split('.').pop()?.toLowerCase();

    try {
      if (extension === 'txt') {
        const reader = new FileReader();
        reader.onload = (event) => {
          const text = event.target?.result as string;
          if (text) setInputText(text);
        };
        reader.readAsText(file);
      } else if (extension === 'docx') {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        if (result.value) setInputText(result.value);
      } else if (extension === 'pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          fullText += textContent.items.map((item: any) => item.str).join(' ') + '\n';
        }
        setInputText(fullText);
      }
    } catch (error) {
      console.error("Error parsing file", error);
    }

    if (e.target) e.target.value = '';
  };

  // Handle system and user theme settings (Light, Dark, and System Mode listener)
  useEffect(() => {
    const savedTheme = localStorage.getItem('sinhala-converter-theme-mode') as ThemeMode || 'system';
    setThemeMode(savedTheme);

    // Load History
    const savedHistory = localStorage.getItem('sinhala-converter-history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history.");
      }
    }

    // Parse URL for shared text
    if (window.location.hash) {
      try {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const sharedText = hashParams.get('t');
        const sharedMode = hashParams.get('m');
        if (sharedText) {
          setInputText(decodeURIComponent(sharedText));
        }
        if (sharedMode) {
          setMode(sharedMode as any);
        }

        // Remove hash from URL without refreshing
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      } catch (e) {
        console.error("Failed to parse share URL.");
      }
    }
  }, []);

  useEffect(() => {
    const applyTheme = () => {
      const isDark =
        themeMode === 'dark' ||
        (themeMode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

      if (isDark) {
        document.documentElement.classList.add('dark');
        setDarkMode(true);
      } else {
        document.documentElement.classList.remove('dark');
        setDarkMode(false);
      }
    };

    applyTheme();
    localStorage.setItem('sinhala-converter-theme-mode', themeMode);

    if (themeMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme();
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [themeMode]);

  // Keyboard handlers
  const handleKeyboardPress = (char: string) => {
    const textarea = document.getElementById('source-textarea') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newText = inputText.substring(0, start) + char + inputText.substring(end);
      setInputText(newText);

      // Preserve cursor position after render
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + char.length;
        textarea.focus();
      }, 0);
    } else {
      setInputText(prev => prev + char);
    }
  };

  const handleKeyboardBackspace = () => {
    const textarea = document.getElementById('source-textarea') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      if (start === end && start > 0) {
        const newText = inputText.substring(0, start - 1) + inputText.substring(end);
        setInputText(newText);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start - 1;
          textarea.focus();
        }, 0);
      } else if (start !== end) {
        const newText = inputText.substring(0, start) + inputText.substring(end);
        setInputText(newText);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start;
          textarea.focus();
        }, 0);
      }
    } else {
      setInputText(prev => prev.slice(0, -1));
    }
  };

  const handleKeyboardSpace = () => {
    handleKeyboardPress(' ');
  };

  // Run conversion whenever input text or conversion mode changes
  useEffect(() => {
    let converted = '';
    let currentMode = mode;

    if (currentMode === 'auto') {
      currentMode = detectEncoding(inputText);
    }

    if (currentMode === 'singlish-to-unicode') {
      converted = singlishToUnicode(inputText);
    } else if (currentMode === 'legacy-to-unicode') {
      converted = legacyToUnicode(inputText, activeFont);
    } else if (currentMode === 'unicode-to-legacy') {
      converted = unicodeToLegacy(inputText, activeFont);
    }

    // Apply smart post-processing
    if (isPostProcessing && inputText) {
      const postProcessed = smartPostProcess(converted);
      setOutputText(postProcessed.text);
      setConfidenceScore(postProcessed.confidence);
    } else {
      setOutputText(converted);
      setConfidenceScore(100);
    }

    // Update typing stats
    const trimmed = inputText.trim();
    setTypingStats({
      charCount: inputText.length,
      wordCount: trimmed ? trimmed.split(/\s+/).length : 0,
    });
  }, [inputText, mode, isPostProcessing, activeFont]);

  // Handle Clipboard Copy
  const handleCopy = async () => {
    if (!outputText) return;
    try {
      await navigator.clipboard.writeText(outputText);
      setCopied(true);
      handleSaveToHistory();
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  // Handle input clean
  const handleClear = () => {
    setInputText('');
    setOutputText('');
  };

  const handleSaveToHistory = () => {
    if (!inputText || !outputText) return;

    const newItem: HistoryItem = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      input: inputText,
      output: outputText,
      mode: mode === 'auto' ? detectEncoding(inputText) : mode
    };

    setHistory(prev => {
      // Don't save if it's the exact same as the most recent item
      if (prev.length > 0 && prev[0].input === newItem.input) return prev;
      const updated = [newItem, ...prev].slice(0, 10); // Keep last 10
      localStorage.setItem('sinhala-converter-history', JSON.stringify(updated));
      return updated;
    });
  };

  const handleShareLink = () => {
    if (!inputText) return;

    // Create short link string using hash URL parameter
    const sharedMode = mode === 'auto' ? detectEncoding(inputText) : mode;
    const url = new URL(window.location.href);
    url.hash = `t=${encodeURIComponent(inputText)}&m=${sharedMode}`;

    navigator.clipboard.writeText(url.toString());
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  // Dynamic placeholders based on selected mode
  const getPlaceholders = () => {
    switch (mode) {
      case 'singlish-to-unicode':
        return {
          input: "Type in Singlish here (e.g., 'amma', 'subha udhasanak', 'sinhala')...",
          output: "Real-time Noto Sans Sinhala (Sinhala Unicode) output will appear here..."
        };
      case 'legacy-to-unicode':
        return {
          input: "Paste legacy FM Abhaya / Kaputa / Dinamina font gibberish here (e.g., 'wïud' or 'iqN i|Eިއdjla fõjd')...",
          output: "Converted standard Noto Sans Sinhala (Sinhala Unicode) will appear here..."
        };
      case 'unicode-to-legacy':
        return {
          input: "Type or paste standard Sinhala Unicode text (Noto Sans Sinhala) here (e.g., 'අම්මා' or 'භාෂාව')...",
          output: "Converted layout keycode string will appear here (Paste into Adobe / Word, select the relevant legacy font)..."
        };
      case 'auto':
      default:
        return {
          input: "Detecting... Type or paste any Sinhala text, Singlish, or Legacy Font gibberish here...",
          output: "Converted text will appear here..."
        };
    }
  };

  // Trigger txt file download of converted output
  const downloadTextFile = () => {
    if (!outputText) return;
    const element = document.createElement("a");
    const file = new Blob([outputText], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `sinhala-conversion-${mode}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Trigger docx file download
  const downloadDocxFile = async () => {
    if (!outputText) return;
    try {
      const doc = new Document({
        sections: [
          {
            children: outputText.split('\n').map(line =>
              new Paragraph({
                children: [
                  new TextRun({
                    text: line,
                    // If output is legacy, attempt to use the activeFont name. Else use standard unicode fonts
                    font: mode === 'unicode-to-legacy'
                      ? (activeFont === 'fm-abhaya' ? 'FMAbhaya' : activeFont)
                      : (outputFont === 'abhaya' ? 'Abhaya Libre' : 'Noto Sans Sinhala')
                  })
                ],
              })
            ),
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      const element = document.createElement("a");
      element.href = URL.createObjectURL(blob);
      element.download = `sinhala-conversion-${mode}.docx`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (err) {
      console.error("Error creating DOCX", err);
    }
  };

  const placeholders = getPlaceholders();

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 font-sans antialiased pb-12`}>

      {/* HEADER SECTION */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/75 dark:bg-slate-900/75 border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
        <div className="max-w-[1400px] mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-transparent flex items-center justify-center ">
              <img src="/image/helasync-icon.png" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                Sinhala Converter
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                OFFLINE PROCESSOR
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/api-docs"
              className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer flex items-center gap-1.5 transition-colors hidden sm:flex"
            >
              <Terminal className="w-4 h-4" />
              API
            </Link>
            <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>
            <div className="flex bg-slate-100/80 dark:bg-slate-800/60 p-1 rounded-xl items-center relative border border-slate-200/50 dark:border-slate-850">
              {(['light', 'dark', 'system'] as const).map((modeOption) => {
                const isActive = themeMode === modeOption;
                return (
                  <button
                    key={modeOption}
                    onClick={() => setThemeMode(modeOption)}
                    className={`relative px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer z-10 ${isActive
                      ? 'text-slate-900 dark:text-white'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                      }`}
                    title={`${modeOption.charAt(0).toUpperCase() + modeOption.slice(1)} Mode`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="active-theme-pill"
                        className="absolute inset-0 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200/65 dark:border-slate-800 -z-10"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    {modeOption === 'light' && <Sun className={`w-3.5 h-3.5 ${isActive ? 'text-amber-500' : ''}`} />}
                    {modeOption === 'dark' && <Moon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : ''}`} />}
                    {modeOption === 'system' && <Laptop className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-500' : ''}`} />}
                    <span className="hidden sm:inline capitalize">{modeOption}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 mt-8 md:mt-12">
        {/* MODE SELECTOR PANEL */}
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 max-w-2xl mx-auto mb-8 bg-slate-200/50 dark:bg-slate-900/55 p-3 rounded-2xl border border-slate-200/35 dark:border-slate-800/40 shadow-inner">
          <div className="flex-1 w-full bg-white dark:bg-slate-800 rounded-xl p-2.5 border border-slate-100 dark:border-slate-700/50 shadow-sm relative focus-within:ring-2 focus-within:ring-orange-500/20">
            <label htmlFor="sourceFormat" className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 px-1">Source Input</label>
            <select
              id="sourceFormat"
              value={mode === 'auto' ? 'auto' : mode === 'unicode-to-legacy' ? 'unicode' : mode === 'legacy-to-unicode' ? 'legacy' : 'singlish'}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'auto') setMode('auto');
                else if (val === 'unicode') setMode('unicode-to-legacy');
                else if (val === 'legacy') setMode('legacy-to-unicode');
                else setMode('singlish-to-unicode');
              }}
              className="w-full bg-transparent border-0 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:ring-0 cursor-pointer appearance-none outline-hidden"
            >
              <option className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold" value="auto">Auto-Detect Encoding</option>
              <option className="bg-slate-100 dark:bg-slate-700 text-slate-400" value="" disabled>─</option>
              <option className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" value="singlish">Singlish (Phonetic)</option>
              <option className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" value="legacy">Legacy Font (FM Abhaya)</option>
              <option className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" value="unicode">Iskolapotha (Unicode)</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          <div className="flex-shrink-0 bg-white dark:bg-slate-800 rounded-full p-2 border border-slate-100 dark:border-slate-700/50 shadow-sm text-slate-400 dark:text-slate-500 hidden sm:block">
            <ArrowLeftRight className="w-4 h-4" />
          </div>

          <div className="flex-1 w-full bg-white dark:bg-slate-800 rounded-xl p-2.5 border border-slate-100 dark:border-slate-700/50 shadow-sm relative focus-within:ring-2 focus-within:ring-orange-500/20">
            <label htmlFor="targetFormat" className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 px-1">Target Output</label>
            <select
              id="targetFormat"
              value={mode === 'unicode-to-legacy' ? 'legacy' : 'unicode'}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'legacy') setMode('unicode-to-legacy');
                else setMode(mode === 'unicode-to-legacy' ? 'singlish-to-unicode' : mode);
              }}
              className="w-full bg-transparent border-0 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:ring-0 cursor-pointer appearance-none outline-hidden"
            >
              <option className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" value="unicode">Iskolapotha (Unicode)</option>
              <option className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" value="legacy">Legacy Font (ASCII)</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* LEGACY FONT TYPE SELECTOR (ONLY VISIBLE IF LEGACY INVOLVED) */}
        {(mode === 'unicode-to-legacy' || mode === 'legacy-to-unicode') && (
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center space-x-1 bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-3">
                Legacy Font Type:
              </span>
              {(['fm-abhaya', 'dinamina', 'kaputa', 'dl-fonts'] as const).map(font => (
                <button
                  key={font}
                  onClick={() => setActiveFont(font)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${activeFont === font
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                >
                  {font === 'fm-abhaya' ? 'FM Abhaya' :
                    font === 'dinamina' ? 'Dinamina' :
                      font === 'kaputa' ? 'Kaputa' : 'DL Fonts'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* WORKSPACE AREA (INPUT & OUTPUT PANELS) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch mb-8">

          {/* INPUT PANEL CARD */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between overflow-hidden transition-all duration-200 focus-within:ring-2 focus-within:ring-orange-500/20 focus-within:border-orange-500/40">
            <div className="p-5 border-b border-slate-100 dark:border-slate-850 flex items-center justify-between">
              <span className="text-xs font-extrabold tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-300 py-1 px-3 rounded-md uppercase font-mono">
                Source Input ({
                  mode === 'auto' ? 'Auto Detect' :
                    mode === 'singlish-to-unicode' ? 'Singlish' :
                      mode === 'legacy-to-unicode' ? 'FM Abhaya' :
                        'Iskolapotha'
                })
              </span>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowKeyboard(!showKeyboard)}
                  className={`text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-colors ${showKeyboard ? 'text-orange-500' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  title="Toggle On-screen Sinhala Keyboard"
                >
                  <Keyboard className="w-4 h-4" />
                  Type in Sinhala
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer flex items-center gap-1.5 transition-colors"
                  title="Upload .txt, .docx, or .pdf for batch conversion"
                >
                  <FileDown className="w-4 h-4" />
                  Upload
                </button>
              </div>
              <input
                type="file"
                accept=".txt,.docx,.pdf"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            <AnimatePresence>
              {showKeyboard && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-b border-slate-100 dark:border-slate-800 overflow-hidden bg-slate-50/50 dark:bg-slate-900/50"
                >
                  <div className="p-4">
                    <WijesekaraKeyboard
                      onKeyPress={handleKeyboardPress}
                      onBackspace={handleKeyboardBackspace}
                      onSpace={handleKeyboardSpace}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={placeholders.input}
              className="w-full min-h-[220px] lg:min-h-[340px] p-5 bg-transparent resize-none border-0 focus:ring-0 focus:outline-hidden text-slate-800 dark:text-slate-200 font-mono tracking-wide"
              style={{ fontSize: `${Math.max(14, fontSize - 2)}px`, lineHeight: lineHeight }}
              id="source-textarea"
            />

            <div className="p-4 bg-slate-50/50 dark:bg-slate-900/55 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono">
              <div className="flex items-center space-x-4">
                <span>Chars: <strong>{typingStats.charCount}</strong></span>
                <span>Words: <strong>{typingStats.wordCount}</strong></span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleShareLink}
                  disabled={!inputText}
                  className={`p-1 px-2.5 rounded-lg border hover:bg-indigo-50 dark:hover:bg-indigo-950/20 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-30 disabled:pointer-events-none ${shareCopied
                    ? 'border-indigo-400 text-indigo-600 dark:text-indigo-400 font-bold'
                    : 'border-slate-200 dark:border-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 text-slate-500'
                    }`}
                  title="Copy a shareable link to this text via URL Hash"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  {shareCopied ? 'Link Copied!' : 'Share'}
                </button>
                <button
                  onClick={handleClear}
                  disabled={!inputText}
                  className="p-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-30 disabled:pointer-events-none"
                  title="Clear all text"
                  id="clear-textarea-btn"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear
                </button>
              </div>
            </div>
          </div>

          {/* OUTPUT PANEL CARD */}
          <div className="bg-white dark:bg-black rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between overflow-hidden relative">

            {/* Conversion Indicator Strip */}
            <div className="h-1 bg-gradient-to-r from-orange-500 via-amber-500 to-indigo-500"></div>

            <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 overflow-x-auto">
              <span className="text-xs font-extrabold tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-1 px-3 rounded-md uppercase font-mono shrink-0 flex items-center gap-2">
                Output ({
                  mode === 'unicode-to-legacy' ? 'FM Abhaya (Legacy)' : 'Unicode'
                })
                {confidenceScore !== null && inputText && (
                  <span className={`px-1.5 py-0.5 rounded text-[10px] ${confidenceScore >= 95 ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400' :
                    confidenceScore >= 75 ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400' :
                      'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400'
                    }`}>
                    {confidenceScore}%
                  </span>
                )}
              </span>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className={`p-1.5 rounded-lg border transition-all cursor-pointer ${showHistory
                    ? 'bg-orange-500 text-white border-orange-600'
                    : 'bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'
                    }`}
                  title="Conversion History"
                >
                  <History className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setInspectMode(!inspectMode)}
                  className={`p-1.5 rounded-lg border transition-all cursor-pointer ${inspectMode
                    ? 'bg-orange-500 text-white border-orange-600'
                    : 'bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'
                    }`}
                  title="Inspect Unicode Code-points"
                >
                  <Hash className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowTypographyConfig(!showTypographyConfig)}
                  className={`p-1.5 rounded-lg border transition-all cursor-pointer ${showTypographyConfig
                    ? 'bg-orange-500 text-white border-orange-600'
                    : 'bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'
                    }`}
                  title="Typography Settings"
                >
                  <Settings2 className="w-4 h-4" />
                </button>
                <label className="flex items-center gap-1.5 cursor-pointer" title="Auto fix al-kanna, yansaya, repaya, and spacing">
                  <input
                    type="checkbox"
                    checked={isPostProcessing}
                    onChange={(e) => setIsPostProcessing(e.target.checked)}
                    className="w-3.5 h-3.5 rounded-sm border-slate-300 text-orange-500 focus:ring-orange-500/20"
                  />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
                    Smart Fix
                  </span>
                </label>

                {/* Output format badge / selector */}
                {mode !== 'unicode-to-legacy' ? (
                  <div className="flex bg-slate-100/80 dark:bg-slate-900/85 p-0.5 rounded-lg border border-slate-200/50 dark:border-slate-800 shrink-0">
                    <button
                      onClick={() => setOutputFont('noto')}
                      className={`px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer transition-colors ${outputFont === 'noto'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                        }`}
                      title="Render standard Unicode Sinhala using the Noto Sans Sinhala style (Sans)"
                    >
                      Noto Sans Sinhala
                    </button>
                    <button
                      onClick={() => setOutputFont('abhaya')}
                      className={`px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer transition-colors ${outputFont === 'abhaya'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                        }`}
                      title="Render standard Unicode Sinhala using the FM Abhaya typography style (Serif)"
                    >
                      Abhaya (Serif)
                    </button>
                  </div>
                ) : (
                  <span className="text-[10px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100/60 dark:border-indigo-900/40 px-2 py-0.5 rounded shrink-0">
                    ASCII Keycodes (for FM Abhaya font)
                  </span>
                )}
              </div>
            </div>

            {/* History Panel */}
            <AnimatePresence>
              {showHistory && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 overflow-hidden max-h-64 overflow-y-auto"
                >
                  <div className="p-4 space-y-2">
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Recent Conversions</h3>
                    {history.length > 0 ? history.map((item) => (
                      <div key={item.id} className="p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-xl relative group cursor-pointer hover:border-orange-200 dark:hover:border-orange-500/30 transition-colors" onClick={() => {
                        setInputText(item.input);
                        setMode(item.mode as any);
                        setShowHistory(false);
                      }}>
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-[9px] font-mono font-bold bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded uppercase">{item.mode}</span>
                          <span className="text-[9px] text-slate-400 font-mono">{new Date(item.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <div className="text-xs text-slate-700 dark:text-slate-300 line-clamp-1 mb-1 font-mono">{item.input}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 font-sinhala-sans">{item.output}</div>
                      </div>
                    )) : (
                      <div className="text-center py-6 text-sm text-slate-400 font-mono">No recent conversions found.</div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Typography Configuration Panel */}
            <AnimatePresence>
              {showTypographyConfig && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 overflow-hidden"
                >
                  <div className="p-4 flex flex-wrap gap-6 items-center">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider w-16">Size</span>
                      <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                        <button
                          onClick={() => setFontSize(f => Math.max(12, f - 1))}
                          className="p-1 rounded cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-mono w-6 text-center text-slate-700 dark:text-slate-300">{fontSize}</span>
                        <button
                          onClick={() => setFontSize(f => Math.min(64, f + 1))}
                          className="p-1 rounded cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider w-20">Line Height</span>
                      <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                        <button
                          onClick={() => setLineHeight(l => Math.max(1, Number((l - 0.1).toFixed(1))))}
                          className="p-1 rounded cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-mono w-6 text-center text-slate-700 dark:text-slate-300">{lineHeight}</span>
                        <button
                          onClick={() => setLineHeight(l => Math.min(3, Number((l + 0.1).toFixed(1))))}
                          className="p-1 rounded cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* If Unicode text rendering, show styled clean text, if legacy show code string mapping */}
            <div className={`w-full min-h-[220px] lg:min-h-[340px] p-5 bg-transparent overflow-y-auto max-w-full break-all selection:bg-orange-600/50 ${inspectMode ? 'font-sans' : 'font-mono text-sm sm:text-base text-slate-800 dark:text-slate-200'}`} id="output-rendered-arena">
              {outputText ? (
                inspectMode ? (
                  <div className="flex flex-wrap gap-2">
                    {outputText.split('').map((char, index) => (
                      <div key={index} className="flex flex-col items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded shadow-xs p-1.5 min-w-[36px]">
                        <span className="text-xl font-medium text-slate-900 dark:text-white leading-none mb-1">{char === ' ' ? '␣' : char}</span>
                        <span className="text-[9px] font-mono font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1 rounded">
                          U+{char.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : mode === 'unicode-to-legacy' ? (
                  <div className="space-y-4">
                    <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/65 dark:border-indigo-900/35 rounded-xl font-sans text-[11px] text-indigo-700 dark:text-indigo-350 leading-relaxed">
                      <b>How to render as FM Abhaya:</b> This is an ASCII byte mapping for older offline publications. Copy this output, paste it into Microsoft Word/InDesign, then <b>select/apply the 'FMAbhaya' font</b> in your software. It will visually render as Sinhala!
                    </div>
                    <div className="whitespace-pre-wrap select-all font-mono text-slate-900 dark:text-slate-100 p-4 bg-slate-50/50 dark:bg-slate-905 border border-slate-200/50 dark:border-slate-800 rounded-xl" style={{ fontSize: `${fontSize}px`, lineHeight }}>
                      {outputText}
                    </div>
                  </div>
                ) : (
                  <div
                    className={`whitespace-pre-wrap select-all text-slate-850 dark:text-slate-150 select-all ${outputFont === 'abhaya'
                      ? 'font-sinhala-serif tracking-normal'
                      : 'font-sinhala-sans tracking-wide font-normal'
                      }`}
                    style={{ fontSize: `${fontSize}px`, lineHeight }}
                  >
                    {outputText}
                  </div>
                )
              ) : (
                <span className="text-slate-400 dark:text-slate-600 font-mono text-xs">{placeholders.output}</span>
              )}
            </div>

            <div className="p-4 bg-slate-50/50 dark:bg-black/40 border-t border-slate-150 dark:border-slate-800/70 flex items-center justify-between">
              <span className="text-[10.5px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1.5 text-center">
                <Lock className="w-3.5 h-3.5 text-emerald-500" />
                Complete Local offline privacy
              </span>

              <div className="flex items-center space-x-2">
                <div className="flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm mr-2 transition-all opacity-80 hover:opacity-100">
                  <button
                    onClick={downloadTextFile}
                    disabled={!outputText}
                    className="py-1.5 px-3 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all text-xs font-semibold tracking-wide cursor-pointer disabled:opacity-20 disabled:pointer-events-none flex items-center gap-1.5 border-r border-slate-200 dark:border-slate-800"
                    title="Export output text to a local text file"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    .txt
                  </button>
                  <button
                    onClick={downloadDocxFile}
                    disabled={!outputText}
                    className="py-1.5 px-3 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all text-xs font-semibold tracking-wide cursor-pointer disabled:opacity-20 disabled:pointer-events-none flex items-center gap-1.5"
                    title="Export output text to a local DOCX file"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    .docx
                  </button>
                </div>

                <button
                  onClick={handleCopy}
                  disabled={!outputText}
                  className={`py-1.5 px-4 rounded-xl text-xs font-bold leading-none tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${copied
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-700/10'
                    : 'bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-600/15 disabled:opacity-20 disabled:pointer-events-none'
                    }`}
                  id="copy-to-clipboard-btn"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Clipboard className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* INTERACTIVE COMPREHENSIVE FONT MAP & KEYMAPS BENTO GRID */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mb-12">

          <button
            onClick={() => setShowKeymap(!showKeymap)}
            className="w-full px-6 py-5 flex items-center justify-between hover:bg-slate-100/50 dark:hover:bg-slate-850 transition-colors text-left cursor-pointer"
            id="toggle-keymap-sheet-btn"
          >
            <div className="flex items-center space-x-3.5">
              <div className="p-2.5 rounded-xl bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400">
                <Keyboard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold tracking-wide uppercase text-slate-800 dark:text-slate-200">
                  Phonetic Keys & Legacy Layout Map Matrix
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Quick references for Singlish romanization sounds and legacy Wijesekara keys.
                </p>
              </div>
            </div>

            <div className="text-slate-400 dark:text-slate-500">
              {showKeymap ? <ChevronUp className="w-5 h-5 text-orange-500" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </button>

          <AnimatePresence>
            {showKeymap && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="border-t border-slate-150 dark:border-slate-800 font-sans"
              >
                <div className="p-6">
                  {/* Tabs Selector inside Map Grid Sheet */}
                  <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-3 mb-5 text-xs font-semibold tracking-wide">
                    <button
                      onClick={() => setActiveTab('consonants')}
                      className={`py-1.5 px-4 rounded-lg cursor-pointer transition-all ${activeTab === 'consonants'
                        ? 'bg-orange-600 text-white font-bold shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                        }`}
                    >
                      Singlish Vowels & Consonants
                    </button>
                    <button
                      onClick={() => setActiveTab('legacy')}
                      className={`py-1.5 px-4 rounded-lg cursor-pointer transition-all ${activeTab === 'legacy'
                        ? 'bg-indigo-600 text-white font-bold shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                        }`}
                    >
                      FMAbhaya/Ispara ASCII Map
                    </button>
                  </div>

                  {activeTab === 'consonants' && (
                    <div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4 font-mono">
                        CONSONANT PHONETICS: Combine any consonant key with a vowel key (e.g. <b>ka</b> = ක, <b>kaa</b> = කා, <b>ki</b> = කි). Standalone consonants get automatic hal-kireema unless trailing letters are typed.
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                        <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-150 dark:border-slate-850/60 font-mono text-xs">
                          <span className="text-slate-400 dark:text-slate-550 block mb-0.5">k -&gt; ක</span>
                          <span className="text-slate-400 dark:text-slate-550 block mb-0.5">ka -&gt; ක</span>
                          <span className="text-slate-400 dark:text-slate-550 block">kaa -&gt; කා</span>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-150 dark:border-slate-850/60 font-mono text-xs">
                          <span className="text-slate-400 dark:text-slate-550 block mb-0.5">g -&gt; ග</span>
                          <span className="text-slate-400 dark:text-slate-550 block mb-0.5">gh -&gt; ඝ</span>
                          <span className="text-slate-400 dark:text-slate-550 block">ga -&gt; ග</span>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-150 dark:border-slate-850/60 font-mono text-xs">
                          <span className="text-slate-400 dark:text-slate-550 block mb-0.5">t -&gt; ට</span>
                          <span className="text-slate-400 dark:text-slate-550 block mb-0.5">T -&gt; ට/ත</span>
                          <span className="text-slate-400 dark:text-slate-550 block">th -&gt; ත</span>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-150 dark:border-slate-850/60 font-mono text-xs">
                          <span className="text-slate-400 dark:text-slate-550 block mb-0.5">d -&gt; ද</span>
                          <span className="text-slate-400 dark:text-slate-550 block mb-0.5">Dh -&gt; ධ</span>
                          <span className="text-slate-400 dark:text-slate-550 block">da -&gt; ද</span>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-150 dark:border-slate-850/60 font-mono text-xs">
                          <span className="text-slate-400 dark:text-slate-550 block mb-0.5">p -&gt; ප</span>
                          <span className="text-slate-400 dark:text-slate-550 block mb-0.5">b -&gt; බ</span>
                          <span className="text-slate-400 dark:text-slate-550 block">bh -&gt; භ</span>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-150 dark:border-slate-850/60 font-mono text-xs">
                          <span className="text-slate-400 dark:text-slate-550 block mb-0.5">m -&gt; ම</span>
                          <span className="text-slate-400 dark:text-slate-550 block mb-0.5">y -&gt; ය</span>
                          <span className="text-slate-400 dark:text-slate-550 block">r -&gt; ර</span>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-150 dark:border-slate-850/60 font-mono text-xs">
                          <span className="text-slate-400 dark:text-slate-550 block mb-0.5">l -&gt; ල</span>
                          <span className="text-slate-400 dark:text-slate-550 block mb-0.5">L -&gt; ළ</span>
                          <span className="text-slate-400 dark:text-slate-550 block">w -&gt; ව</span>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-150 dark:border-slate-850/60 font-mono text-xs">
                          <span className="text-slate-400 dark:text-slate-550 block mb-0.5">s -&gt; ස</span>
                          <span className="text-slate-400 dark:text-slate-550 block mb-0.5 font-sans">sh/Sh -&gt; ශ/ෂ</span>
                          <span className="text-slate-400 dark:text-slate-550 block">h -&gt; හ</span>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-150 dark:border-slate-850/60 font-mono text-xs">
                          <span className="text-slate-400 dark:text-slate-550 block mb-0.5">ae -&gt; ඇ</span>
                          <span className="text-slate-400 dark:text-slate-550 block mb-0.5">aae -&gt; ඈ</span>
                          <span className="text-slate-400 dark:text-slate-550 block">ai -&gt; ඓ</span>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-150 dark:border-slate-850/60 font-mono text-xs">
                          <span className="text-slate-400 dark:text-slate-550 block mb-0.5">au -&gt; ඖ</span>
                          <span className="text-slate-400 dark:text-slate-550 block mb-0.5">ndg -&gt; ඟ</span>
                          <span className="text-slate-400 dark:text-slate-550 block">mb -&gt; ඹ</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'legacy' && (
                    <div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4 font-mono">
                        WIJESEKARA ASCII CODE: Keyboard mappings used heavily by offline publishing software like InDesign/Word in Sri Lanka with old fonts. Perfect for resolving legacy books output directly to Unicode.
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                        <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-150 dark:border-slate-850/60 font-mono text-xs">
                          <span className="text-slate-400 dark:text-slate-550 block mb-1">w -&gt; අ</span>
                          <span className="text-slate-400 dark:text-slate-550 block">wd -&gt; ආ</span>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-150 dark:border-slate-850/60 font-mono text-xs">
                          <span className="text-slate-400 dark:text-slate-550 block mb-1">l -&gt; ක</span>
                          <span className="text-slate-400 dark:text-slate-550 block">u -&gt; ම</span>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-150 dark:border-slate-850/60 font-mono text-xs">
                          <span className="text-slate-400 dark:text-slate-550 block mb-1">k -&gt; න</span>
                          <span className="text-slate-400 dark:text-slate-550 block">g -&gt; ට</span>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-150 dark:border-slate-850/60 font-mono text-xs">
                          <span className="text-slate-400 dark:text-slate-550 block mb-1">; -&gt; ත</span>
                          <span className="text-slate-400 dark:text-slate-550 block">o -&gt; ද</span>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-150 dark:border-slate-850/60 font-mono text-xs">
                          <span className="text-slate-400 dark:text-slate-550 block mb-1">v -&gt; ප</span>
                          <span className="text-slate-400 dark:text-slate-550 block">n -&gt; බ</span>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-150 dark:border-slate-850/60 font-mono text-xs col-span-2">
                          <span className="font-bold text-orange-500 block mb-1">Common Joint Match:</span>
                          <span className="text-slate-400 dark:text-slate-550 font-bold block">wïud -&gt; අම්මා</span>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-150 dark:border-slate-850/60 font-mono text-xs col-span-2">
                          <span className="font-bold text-indigo-500 block mb-1">Kombuva Pattern:</span>
                          <span className="text-slate-400 dark:text-slate-550 block font-bold">s + l + d -&gt; කො</span>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ROADMAP / FEATURES SECTION */}

      </main>


      <footer className="max-w-6xl mx-auto px-4 mt-16 pt-8 border-t border-slate-200 dark:border-slate-850 text-center">
        <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">
          Sinhala Font and Unicode Converter &copy; 2026.
        </p>

        <Link to="/privacy" className="text-xs text-slate-400 hover:text-orange-500 transition-colors">
          Privacy Policy
        </Link>
      </footer>
    </div>
  );
}
