/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Global Type Definitions for Conversion Modes
export type ConversionMode = 'singlish-to-unicode' | 'legacy-to-unicode' | 'unicode-to-legacy' | 'auto';

export type LegacyFontType = 'fm-abhaya' | 'ispara' | 'dinamina' | 'kaputa' | 'dl-fonts';

// ==========================================
// AUTO-DETECT ENGINE
// ==========================================
export function detectEncoding(text: string): ConversionMode {
  if (!text) return 'singlish-to-unicode';
  
  // Check for Sinhala Unicode range
  if (/[\u0D80-\u0DFF]/.test(text)) {
    return 'unicode-to-legacy';
  }
  
  // Predict Legacy vs Singlish based on character occurrences
  // Wijesekara layout has frequent use of specific characters: s, d, w, l, k, ;
  const legacyChars = text.match(/[swlk;o'fS]/g);
  const singlishChars = text.match(/[aeiou]/gi);
  
  if (legacyChars && singlishChars) {
    if (legacyChars.length > singlishChars.length) return 'legacy-to-unicode';
    return 'singlish-to-unicode';
  } else if (legacyChars) {
    return 'legacy-to-unicode';
  }
  
  return 'singlish-to-unicode';
}

// ==========================================
// 1. SINGLISH TO UNICODE TRANSLITERATION ENGINE
// ==========================================

// Map of vowels in Singlish
const singlishVowels: Record<string, string> = {
  "aae": "ඈ", "aeae": "ඈ",
  "ae": "ඇ", "aa": "ආ", "ii": "ඊ", "uu": "ඌ", "ee": "ඒ", "oo": "ඕ", "au": "ඖ", "ai": "ඓ",
  "a": "අ", "i": "ඉ", "u": "උ", "e": "එ", "o": "ඔ", "A": "ආ", "I": "ඊ", "U": "ඌ", "E": "ඒ", "O": "ඕ"
};

// Map of base consonants in Singlish
const singlishConsonants: Record<string, string> = {
  "ndh": "ඳ",
  "ndg": "ඟ",
  "ndj": "ඬ",
  "mb": "ඹ",
  "sh": "ශ", "Sh": "ෂ", "S": "ශ",
  "th": "ත", "Th": "ථ",
  "dh": "ද", "Dh": "ධ",
  "kh": "ඛ", "gh": "ඝ", "G": "ඝ",
  "ch": "ච", "Ch": "ඡ", "C": "ඡ",
  "jh": "ඣ", "ph": "ඵ", "bh": "භ", "B": "භ",
  "k": "ක", "g": "ග", "c": "ච", "j": "ජ", "t": "ට", "T": "ට",
  "d": "ඩ", "D": "ඩ", "n": "න", "N": "ණ", "p": "ප", "b": "බ",
  "m": "ම", "y": "ය", "r": "ර", "l": "ල", "L": "ළ", "v": "ව", "w": "ව",
  "s": "ස", "h": "හ", "f": "ෆ"
};

// Map of vowel modifiers (pilas) when attached to a consonant
const singlishModifiers: Record<string, string> = {
  "aae": "ෑ", "aeae": "ෑ",
  "ae": "ැ", "aa": "ා", "ii": "ී", "uu": "ූ", "ee": "ේ", "oo": "ෝ", "au": "ෞ", "ai": "ෛ",
  "a": "", "i": "ි", "u": "ු", "e": "ෙ", "o": "ො", "A": "ා", "I": "ී", "U": "ූ", "E": "ේ", "O": "ෝ"
};

/**
 * Transliterates Romanized Singlish text to Sinhala Unicode.
 * Uses a greedy scanner that matches longest prefixes first (consonant clusters & vowel combinations).
 */
export function singlishToUnicode(text: string): string {
  if (!text) return "";
  let result = "";
  let i = 0;
  const len = text.length;

  while (i < len) {
    // 1. Check if there are common English punctuation or numbers
    const char = text[i];
    if (/[^a-zA-Z]/.test(char)) {
      result += char;
      i++;
      continue;
    }

    // 2. Greedy match for consonants
    let matchedConsonant = "";
    let consonantKey = "";
    const consonantKeys = ["ndh", "ndg", "ndj", "mb", "sh", "Sh", "th", "Th", "dh", "Dh", "kh", "gh", "ch", "Ch", "jh", "ph", "bh", "k", "g", "c", "j", "t", "T", "d", "D", "n", "N", "p", "b", "m", "y", "r", "l", "L", "v", "w", "s", "S", "B", "C", "G", "h", "f"];
    
    for (const key of consonantKeys) {
      if (text.substr(i, key.length) === key) {
        matchedConsonant = singlishConsonants[key];
        consonantKey = key;
        break;
      }
    }

    if (matchedConsonant) {
      i += consonantKey.length;
      
      // Look ahead for specifiers (yansaya 'y', rakaaransaya 'r' or vowels)
      let matchedYansaya = false;
      let matchedRakaaransaya = false;
      
      if (i < len && text[i] === 'y' && !(/[aeiouAEIOU]/.test(text[i+1] || ''))) {
        matchedYansaya = true;
        i++;
      } else if (i < len && text[i] === 'r' && !(/[aeiouAEIOU]/.test(text[i+1] || ''))) {
        matchedRakaaransaya = true;
        i++;
      }

      // Check for following vowel
      let matchedModifier = "";
      let modifierKey = "";
      const modifierKeys = ["aae", "aeae", "ae", "aa", "ii", "uu", "ee", "oo", "au", "ai", "a", "i", "u", "e", "o", "A", "I", "U", "E", "O"];
      
      for (const mKey of modifierKeys) {
        if (text.substr(i, mKey.length) === mKey) {
          matchedModifier = singlishModifiers[mKey];
          modifierKey = mKey;
          break;
        }
      }

      if (matchedModifier !== undefined && modifierKey) {
        // We found a consonant followed by a vowel modifier!
        result += matchedConsonant;
        if (matchedYansaya) result += "්‍ය";
        if (matchedRakaaransaya) result += "්‍ර";
        result += matchedModifier;
        i += modifierKey.length;
      } else {
        // Consonant followed by another consonant or space (adds Virama / Hal kireema)
        result += matchedConsonant;
        if (matchedYansaya) {
          result += "්‍ය";
        } else if (matchedRakaaransaya) {
          result += "්‍ර";
        } else {
          result += "්";
        }
      }
    } else {
      // 3. Greedy match for standalone vowels
      let matchedVowel = "";
      let vowelKey = "";
      const vowelKeys = ["aae", "aeae", "ae", "aa", "ii", "uu", "ee", "oo", "au", "ai", "a", "i", "u", "e", "o", "A", "I", "U", "E", "O"];
      
      for (const vKey of vowelKeys) {
        if (text.substr(i, vKey.length) === vKey) {
          matchedVowel = singlishVowels[vKey];
          vowelKey = vKey;
          break;
        }
      }

      if (matchedVowel) {
        result += matchedVowel;
        i += vowelKey.length;
      } else {
        // Fallback
        result += text[i];
        i++;
      }
    }
  }

  return result;
}

// ==========================================
// 2. WIJESEKARA / FM ABHAYA / ISPARA TO UNICODE TRANSLITERATOR
// ==========================================

// Mappings of single characters typed in legacy Wijesekara layout to Unicode.
// Both FM Abhaya and Ispara fonts share this exact same keyboard codepage map.
const legacyToUnicodeMap: Record<string, string> = {
  "w": "අ", "W": "උ", "b": "ඉ", "B": "ඊ", "t": "එ", "T": "ඓ", "W_": "ඌ", "tS": "ඒ", "Caf": "ඔ", "´": "ඕ", "C": "ඖ",
  "l": "ක", "L": "ඛ", "g": "ග", "M": "ඝ", "X": "ඞ",
  "p": "ච", "P": "ඡ", "c": "ජ", "C_": "ඣ", "A_": "ඤ",
  "g_": "ට", "G": "ඪ", "K": "ණ",
  ";": "ත", ":": "ථ", "o": "ද", "O": "ධ", "k": "න",
  "v": "ප", "V": "ඵ", "n": "බ", "N": "භ", "u": "ම",
  "h": "ය", "r": "ර", "'": "ල", "j": "ව", "Y": "ශ", "I": "ෂ", "i": "ස", "y": "හ", "ß": "ළ", 
  "x": "ං", "›": "ඃ", "H": "්‍ය", "`": "්‍ර", "˚": "ං", "q": "ු", "Q": "ූ", "s": "ෙ", "S": "ෛ", "d": "ා", "e": "ැ", "E": "ෑ", "f": "ි", "F": "ී", "a": "්", "A": "්"
};

// Map representing how vowels are modified in Unicode
const vowelModifiers = ["්", "ා", "ැ", "ෑ", "ි", "ී", "ු", "ූ", "ෙ", "ේ", "ෛ", "ො", "ෝ", "ෞ", "්‍ර", "්‍ය"];

/**
 * Converts legacy ASCII font encodings (like FM Abhaya, Ispara, FMMalithi) to Sinhala Unicode.
 * Since legacy typing is visual, sequences like kombin-consonant (e.g. "s" + "l" -> "කෙ") 
 * must be reordered so that the modifiers are attached after the consonants in Unicode.
 */
export function legacyToUnicode(text: string, fontType: LegacyFontType = 'fm-abhaya'): string {
  if (!text) return "";
  let out = text;

  // 1. Reorder combinations of Kombuva in legacy layout (leads with 's')
  // Pattern 1: s + [consonant/modifier] + d or d' -> kombuva + consonant + elapilla -> 'ො' or 'ෝ'
  // E.g. "s" + "l" + "d" (කො) -> "l" + "ො"
  // "s" + "l" + "d" + "a" (කෝ) -> "l" + "ෝ"
  
  // s + <C> + d + a -> <C> + ෝ
  // Match any character that stands for a consonant in the middle
  out = out.replace(/s([a-zA-Z;':"´`˚™šœŸžŸ])da/g, "$1ෝ");
  out = out.replace(/s([a-zA-Z;':"´`˚™šœŸžŸ])d/g, "$1ො");
  out = out.replace(/s([a-zA-Z;':"´`˚™šœŸžŸ])a/g, "$1ේ");
  out = out.replace(/s([a-zA-Z;':"´`˚™šœŸžŸ])/g, "$1ෙ");
  
  // Kombuva deka: S + <C> -> <C> + ෛ
  out = out.replace(/S([a-zA-Z;':"´`˚™šœŸžŸ])/g, "$1ෛ");

  // Rakaaransaya (typing standard console key ` after consonant)
  // `<C>` + ` -> <C> + ්‍ර
  out = out.replace(/([a-zA-Z;':"´`˚™šœŸžŸ])`/g, "$1්‍ර");
  
  // Yansaya (typing H after consonant)
  out = out.replace(/([a-zA-Z;':"´`˚™šœŸžŸ])H/g, "$1්‍ය");

  // 2. Character-by-character translation of individual keys using the Legacy Layout Map
  let result = "";
  for (let i = 0; i < out.length; i++) {
    const char = out[i];
    // Special combination check for two characters mapping to one
    if (i < out.length - 1 && legacyToUnicodeMap[char + out[i+1]]) {
      result += legacyToUnicodeMap[char + out[i+1]];
      i++;
    } else if (legacyToUnicodeMap[char]) {
      result += legacyToUnicodeMap[char];
    } else {
      result += char;
    }
  }

  // Double check and fix redundant modifiers
  result = result.replace(/ො/g, "ො");
  result = result.replace(/ෝ/g, "ෝ");
  result = result.replace(/ේ/g, "ේ");

  return result;
}

// ==========================================
// 3. UNICODE TO WIJESEKARA / FM ABHAYA / ISPARA TRANSLITERATOR
// ==========================================

// Reverse maps for individual layout glyph parts
const unicodeToLegacyMap: Record<string, string> = {
  "අ": "w", "ආ": "wd", "ඇ": "we", "ඈ": "wE", "ඉ": "b", "ඊ": "B", "උ": "W", "ඌ": "W_", "එ": "t", "ඒ": "tS", "ඓ": "T", "ඔ": "Caf", "ඕ": "´", "ඖ": "C",
  "ක": "l", "ඛ": "L", "ග": "g", "ඝ": "M", "ඞ": "X",
  "ච": "p", "ඡ": "P", "ජ": "c", "ඣ": "C_", "ඤ": "A_",
  "ට": "g_", "ඪ": "G", "ණ": "K",
  "ත": ";", "ථ": ":", "ද": "o", "ධ": "O", "න": "k",
  "ප": "v", "ඵ": "V", "බ": "n", "භ": "N", "ම": "u",
  "ය": "h", "ර": "r", "ල": "'", "ව": "j", "ශ": "Y", "ෂ": "I", "ස": "i", "හ": "y", "ළ": "ß", "ෆ": "f",
  "ං": "x", "ඃ": "›"
};

/**
 * Converts Sinhala Unicode back into FM Abhaya / Ispara ASCII typewriter string formats.
 * Highly valuable for layout designers who need to export web-composed text to standard desktop publishing software.
 */
export function unicodeToLegacy(text: string, fontType: LegacyFontType = 'fm-abhaya'): string {
  if (!text) return "";
  let out = text;

  // Let's replace complex vowel combinations first, then match single items
  // 1. Resolve modifiers and attach back of legacy visually-leading elements like Kombuva 's'
  const consonantsList = ["ක", "ඛ", "ග", "ඝ", "ඞ", "ච", "ඡ", "ජ", "ඣ", "ඤ", "ට", "ඨ", "ඩ", "ඪ", "ණ", "ත", "ථ", "ද", "ධ", "න", "ප", "ඵ", "බ", "භ", "ම", "ය", "ර", "ල", "ව", "ශ", "ෂ", "ස", "හ", "ළ", "ෆ"];
  
  for (const C of consonantsList) {
    const legC = unicodeToLegacyMap[C] || C;
    
    // Pattern: C + ෝ -> s + legC + d + a ("කෝ" -> "s"+"l"+"d"+"a")
    out = out.split(C + "ෝ").join("s" + legC + "da");
    // Pattern: C + ො -> s + legC + d ("කො" -> "s"+"l"+"d")
    out = out.split(C + "ො").join("s" + legC + "d");
    // Pattern: C + ේ -> s + legC + a ("කේ" -> "s"+"l"+"a")
    out = out.split(C + "ේ").join("s" + legC + "a");
    // Pattern: C + ෙ -> s + legC ("කෙ" -> "s"+"l")
    out = out.split(C + "ෙ").join("s" + legC);
    // Pattern: C + ෛ -> S + legC ("කෛ" -> "S"+"l")
    out = out.split(C + "ෛ").join("S" + legC);
    
    // Pattern: C + ්‍ර (Rakaaransaya) -> legC + ` ("ක්‍ර" -> "l"+"`")
    out = out.split(C + "්‍ර").join(legC + "`");
    // Pattern: C + ්‍ය (Yansaya) -> legC + H ("ක්‍ය" -> "l"+"H")
    out = out.split(C + "්‍ය").join(legC + "H");
    
    // Pattern: C + ා -> legC + d ("කා" -> "l"+"d")
    out = out.split(C + "ා").join(legC + "d");
    // Pattern: C + ැ -> legC + e ("කැ" -> "l"+"e")
    out = out.split(C + "ැ").join(legC + "e");
    // Pattern: C + ෑ -> legC + E ("කෑ" -> "l"+"E")
    out = out.split(C + "ෑ").join(legC + "E");
    // Pattern: C + ි -> legC + f ("කි" -> "l"+"f")
    out = out.split(C + "ි").join(legC + "f");
    // Pattern: C + ී -> legC + F ("කී" -> "l"+"F")
    out = out.split(C + "ී").join(legC + "F");
    // Pattern: C + ු -> legC + q ("කු" -> "l"+"q")
    out = out.split(C + "ු").join(legC + "q");
    // Pattern: C + ූ -> legC + Q ("කූ" -> "l"+"Q")
    out = out.split(C + "ූ").join(legC + "Q");
    // Pattern: C + ් -> legC + a ("ක්" -> "l"+"a")
    out = out.split(C + "්").join(legC + "a");
  }

  // 2. Map standard legacy letters (consonants / vowels)
  let result = "";
  for (let i = 0; i < out.length; i++) {
    const char = out[i];
    if (unicodeToLegacyMap[char]) {
      result += unicodeToLegacyMap[char];
    } else {
      result += char;
    }
  }

  return result;
}

// ==========================================
// SMART POST-PROCESSING ENGINE
// ==========================================
export function smartPostProcess(text: string): { text: string; confidence: number } {
  if (!text) return { text: "", confidence: 100 };
  
  let processed = text;
  let modifications = 0;
  
  const originalLength = processed.length || 1;

  // 1. Fix Al-kanna (Hal kireema) errors
  // Redundant al-kanna after another al-kanna or vowels
  const alKannaRegex = /([්ාැෑිීුූෙේෛොෝෞ])්/g;
  processed = processed.replace(alKannaRegex, (match, p1) => {
    modifications++;
    return p1;
  });

  // 2. Fix Yansaya errors
  // Invalid combinations where yansaya should be used instead of just 'ය' following a consonant with al-kanna
  // e.g. "ක්ය" -> "ක්‍ය"
  const yansayaRegex = /([ක-ෆ])්ය/g;
  processed = processed.replace(yansayaRegex, (match, p1) => {
    modifications++;
    return p1 + "්‍ය";
  });

  // 3. Fix Repaya and Rakaaransaya
  // Repaya
  // "ර්" + consonant -> "ර්‍" + consonant
  const repayaRegex = /ර්([ක-ෆ])/g;
  processed = processed.replace(repayaRegex, (match, p1) => {
    modifications++;
    return "ර්‍" + p1;
  });

  // Rakaaransaya
  // "ක්ර" -> "ක්‍ර"
  const rakaaransayaRegex = /([ක-ෆ])්ර/g;
  processed = processed.replace(rakaaransayaRegex, (match, p1) => {
    modifications++;
    return p1 + "්‍ර";
  });

  // 4. Punctuation & Spacing Normalisation
  // Multiple spaces to single space
  const multiSpaceRegex = / {2,}/g;
  processed = processed.replace(multiSpaceRegex, () => {
    modifications++;
    return ' ';
  });

  // Space before punctuation
  const spaceBeforePunctuationRegex = / +([.,!?])/g;
  processed = processed.replace(spaceBeforePunctuationRegex, (match, p1) => {
    modifications++;
    return p1;
  });

  // Missing space after punctuation (excluding numbers like 3.14)
  const spaceAfterPunctuationRegex = /([a-zA-Z\u0D80-\u0DFF][.,!?])([a-zA-Z\u0D80-\u0DFF])/g;
  processed = processed.replace(spaceAfterPunctuationRegex, (match, p1, p2) => {
    modifications++;
    return p1 + ' ' + p2;
  });

  // 5. Mixed Sinhala + English Handling
  const engSinhalaBoundaryRegex = /([a-zA-Z])([\u0D80-\u0DFF])/g;
  processed = processed.replace(engSinhalaBoundaryRegex, (match, p1, p2) => {
    modifications++;
    return p1 + ' ' + p2;
  });

  const sinhalaEngBoundaryRegex = /([\u0D80-\u0DFF])([a-zA-Z])/g;
  processed = processed.replace(sinhalaEngBoundaryRegex, (match, p1, p2) => {
    modifications++;
    return p1 + ' ' + p2;
  });

  // Compute confidence score based on modifications relative to length
  const errorRate = (modifications / originalLength);
  let confidence = Math.round(100 - (errorRate * 300)); 
  if (confidence > 100) confidence = 100;
  if (confidence < 25) confidence = 25;
  
  return { text: processed, confidence };
}

