import React, { useState } from 'react';
import { Delete, Space } from 'lucide-react';

interface KeyboardProps {
  onKeyPress: (char: string) => void;
  onBackspace: () => void;
  onSpace: () => void;
}

const normalMap: Record<string, string> = {
  '`': '්‍ර', '1': '1', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8', '9': '9', '0': '0', '-': '-', '=': '=',
  'q': 'ු', 'w': 'අ', 'e': 'ඇ', 'r': 'ර', 't': 'එ', 'y': 'හ', 'u': 'ම', 'i': 'ස', 'o': 'ද', 'p': 'ච', '[': 'ඥ', ']': ';', '\\': '\\',
  'a': '්', 's': 'ි', 'd': 'ා', 'f': 'ෙ', 'g': 'ට', 'h': 'ය', 'j': 'ව', 'k': 'න', 'l': 'ක', ';': 'ත', "'": '.',
  'z': 'ං', 'x': 'ං', 'c': 'ජ', 'v': 'ඩ', 'b': 'ඉ', 'n': 'බ', 'm': 'ප', ',': 'ල', '.': 'ග', '/': 'ශ'
};

const shiftMap: Record<string, string> = {
  '~': 'ර්‍', '!': '!', '@': '@', '#': '#', '$': '$', '%': '%', '^': '^', '&': '&', '*': '*', '(': '(', ')': ')', '_': '_', '+': '+',
  'Q': 'ූ', 'W': 'ආ', 'E': 'ඈ', 'R': 'ඍ', 'T': 'ඒ', 'Y': 'ශ', 'U': 'ඹ', 'I': 'ෂ', 'O': 'ධ', 'P': 'ඡ', '{': 'ඣ', '}': ':', '|': '|',
  'A': 'ෟ', 'S': 'ී', 'D': 'ෘ', 'F': 'ේ', 'G': 'ඨ', 'H': '්‍ය', 'J': 'ළු', 'K': 'ණ', 'L': 'ඛ', ':': 'ථ', '"': ',',
  'Z': 'ඞ', 'X': 'ඞ', 'C': 'ඣ', 'V': 'ඪ', 'B': 'ඊ', 'N': 'භ', 'M': 'ඵ', '<': 'ළ', '>': 'ඝ', '?': 'ඦ'
};

const keyboardRows = [
  ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='],
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'"],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/']
];

export const WijesekaraKeyboard: React.FC<KeyboardProps> = ({ onKeyPress, onBackspace, onSpace }) => {
  const [isShift, setIsShift] = useState(false);

  const renderKey = (baseKey: string) => {
    const shiftKey = baseKey.length === 1 && baseKey.match(/[a-z]/i) 
      ? baseKey.toUpperCase() 
      : Object.keys(shiftMap)[Object.keys(normalMap).indexOf(baseKey)] || baseKey;

    const currentKey = isShift ? shiftKey : baseKey;
    const currentMap = isShift ? shiftMap : normalMap;
    const displayChar = currentMap[currentKey] || currentKey;

    return (
      <button
        key={baseKey}
        onClick={() => onKeyPress(displayChar)}
        className="flex flex-col items-center justify-center p-1 sm:p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700 active:bg-slate-100 dark:active:bg-slate-600 transition-colors cursor-pointer min-w-[28px] sm:min-w-[36px] h-10 sm:h-12"
      >
        <span className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200 leading-none mb-1">
          {displayChar}
        </span>
        <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase">
          {currentKey}
        </span>
      </button>
    );
  };

  return (
    <div className="bg-slate-100 dark:bg-slate-900 p-2 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-inner overflow-x-auto">
      <div className="flex flex-col gap-1.5 sm:gap-2 min-w-[600px]">
        {/* Row 1 */}
        <div className="flex justify-center gap-1 sm:gap-1.5">
          {keyboardRows[0].map(renderKey)}
          <button 
            onClick={onBackspace}
            className="flex items-center justify-center px-4 bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded shadow-xs hover:bg-slate-300 dark:hover:bg-slate-600 active:bg-slate-400 dark:active:bg-slate-500 transition-colors text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            <Delete className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
        
        {/* Row 2 */}
        <div className="flex justify-center gap-1 sm:gap-1.5 pl-4 sm:pl-6">
          {keyboardRows[1].map(renderKey)}
        </div>
        
        {/* Row 3 */}
        <div className="flex justify-center gap-1 sm:gap-1.5 pl-8 sm:pl-10">
          {keyboardRows[2].map(renderKey)}
        </div>
        
        {/* Row 4 */}
        <div className="flex justify-center gap-1 sm:gap-1.5">
          <button 
            onClick={() => setIsShift(!isShift)}
            className={`flex items-center justify-center px-4 sm:px-6 border rounded shadow-xs transition-colors cursor-pointer font-bold text-xs uppercase tracking-wider ${
              isShift 
                ? 'bg-orange-500 border-orange-600 text-white hover:bg-orange-600' 
                : 'bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
            }`}
          >
            Shift
          </button>
          {keyboardRows[3].map(renderKey)}
          <button 
            onClick={() => setIsShift(!isShift)}
            className={`flex items-center justify-center px-4 sm:px-6 border rounded shadow-xs transition-colors cursor-pointer font-bold text-xs uppercase tracking-wider ${
              isShift 
                ? 'bg-orange-500 border-orange-600 text-white hover:bg-orange-600' 
                : 'bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
            }`}
          >
            Shift
          </button>
        </div>
        
        {/* Row 5 (Space) */}
        <div className="flex justify-center mt-1">
          <button 
            onClick={onSpace}
            className="flex items-center justify-center w-64 h-10 sm:h-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700 active:bg-slate-100 dark:active:bg-slate-600 transition-colors text-slate-400 cursor-pointer"
          >
            <Space className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
