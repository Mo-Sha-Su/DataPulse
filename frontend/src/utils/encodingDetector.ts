/**
 * Shared encoding detection and text decoding engine for Data Pulse.
 * Implements strict hierarchical detection:
 * 1. BOM (UTF-8, UTF-16LE, UTF-16BE)
 * 2. UTF-16 without BOM (pattern of alternating zero bytes)
 * 3. Valid UTF-8 verification
 * 4. Legacy code pages scored by script & language plausibility
 * 5. Fallback to Windows-1252
 */

export interface DetectedEncoding {
  encoding: string;
  confidence: number;
  reason: string;
}

export interface DecodedResult {
  text: string;
  encoding: string;
  hasReplacementChar: boolean;
  reason: string;
}

export const SUPPORTED_ENCODINGS = [
  { label: 'Auto Detect', value: 'auto' },
  { label: 'UTF-8', value: 'utf-8' },
  { label: 'UTF-16 LE', value: 'utf-16le' },
  { label: 'UTF-16 BE', value: 'utf-16be' },
  { label: 'Windows-1256 (Arabic)', value: 'windows-1256' },
  { label: 'ISO-8859-6 (Arabic)', value: 'iso-8859-6' },
  { label: 'Windows-1251 (Cyrillic)', value: 'windows-1251' },
  { label: 'KOI8-R (Cyrillic)', value: 'koi8-r' },
  { label: 'Windows-1253 (Greek)', value: 'windows-1253' },
  { label: 'Windows-1255 (Hebrew)', value: 'windows-1255' },
  { label: 'Windows-874 (Thai)', value: 'windows-874' },
  { label: 'Shift_JIS (Japanese)', value: 'shift_jis' },
  { label: 'EUC-JP (Japanese)', value: 'euc-jp' },
  { label: 'GBK (Simplified Chinese)', value: 'gbk' },
  { label: 'GB18030 (Chinese)', value: 'gb18030' },
  { label: 'Big5 (Traditional Chinese)', value: 'big5' },
  { label: 'EUC-KR (Korean)', value: 'euc-kr' },
  { label: 'Windows-1252 (Western European)', value: 'windows-1252' },
] as const;

/**
 * Checks if a byte buffer starts with a known Byte Order Mark (BOM).
 */
export function detectBOM(bytes: Uint8Array): { encoding: string; reason: string; bomLength: number } | null {
  if (bytes.length >= 3 && bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) {
    return { encoding: 'utf-8', reason: 'UTF-8 Byte Order Mark (EF BB BF) detected', bomLength: 3 };
  }
  if (bytes.length >= 2 && bytes[0] === 0xFF && bytes[1] === 0xFE) {
    return { encoding: 'utf-16le', reason: 'UTF-16 LE Byte Order Mark (FF FE) detected', bomLength: 2 };
  }
  if (bytes.length >= 2 && bytes[0] === 0xFE && bytes[1] === 0xFF) {
    return { encoding: 'utf-16be', reason: 'UTF-16 BE Byte Order Mark (FE FF) detected', bomLength: 2 };
  }
  return null;
}

/**
 * Detects UTF-16 without BOM by looking for zero bytes alternating in every other position.
 */
export function detectUTF16WithoutBOM(bytes: Uint8Array): { encoding: string; reason: string } | null {
  if (bytes.length < 4) return null;
  const sampleLength = Math.min(bytes.length - (bytes.length % 2), 1024);
  let evenZeroes = 0;
  let oddZeroes = 0;
  let evenAscii = 0;
  let oddAscii = 0;

  for (let i = 0; i < sampleLength; i += 2) {
    const b0 = bytes[i];
    const b1 = bytes[i + 1];
    if (b0 === 0x00) evenZeroes++;
    if (b1 === 0x00) oddZeroes++;
    if (b0 >= 0x20 && b0 <= 0x7E) evenAscii++;
    if (b1 >= 0x20 && b1 <= 0x7E) oddAscii++;
  }

  const pairs = sampleLength / 2;
  // LE: ASCII characters are in even positions (0, 2, 4), and high bytes (odd positions 1, 3, 5) are 0x00
  if (oddZeroes / pairs >= 0.65 && evenAscii / pairs >= 0.4 && evenZeroes / pairs < 0.1) {
    return { encoding: 'utf-16le', reason: 'Alternating zero bytes in odd positions indicates UTF-16 LE without BOM' };
  }
  // BE: high bytes are in even positions (0x00), ASCII characters in odd positions
  if (evenZeroes / pairs >= 0.65 && oddAscii / pairs >= 0.4 && oddZeroes / pairs < 0.1) {
    return { encoding: 'utf-16be', reason: 'Alternating zero bytes in even positions indicates UTF-16 BE without BOM' };
  }
  return null;
}

/**
 * Verifies if bytes form valid UTF-8.
 */
export function isValidUTF8(bytes: Uint8Array): { valid: boolean; hasMultiByte: boolean } {
  let hasMultiByte = false;
  let i = 0;
  const len = bytes.length;

  while (i < len) {
    const b0 = bytes[i];
    if (b0 < 0x80) {
      i++;
    } else if ((b0 & 0xE0) === 0xC0) {
      // 2-byte sequence: 110xxxxx 10xxxxxx
      if (b0 < 0xC2) return { valid: false, hasMultiByte }; // overlong
      if (i + 1 >= len) return { valid: false, hasMultiByte };
      const b1 = bytes[i + 1];
      if ((b1 & 0xC0) !== 0x80) return { valid: false, hasMultiByte };
      hasMultiByte = true;
      i += 2;
    } else if ((b0 & 0xF0) === 0xE0) {
      // 3-byte sequence: 1110xxxx 10xxxxxx 10xxxxxx
      if (i + 2 >= len) return { valid: false, hasMultiByte };
      const b1 = bytes[i + 1];
      const b2 = bytes[i + 2];
      if ((b1 & 0xC0) !== 0x80 || (b2 & 0xC0) !== 0x80) return { valid: false, hasMultiByte };
      if (b0 === 0xE0 && b1 < 0xA0) return { valid: false, hasMultiByte }; // overlong
      if (b0 === 0xED && b1 >= 0xA0) return { valid: false, hasMultiByte }; // surrogate range
      hasMultiByte = true;
      i += 3;
    } else if ((b0 & 0xF8) === 0xF0) {
      // 4-byte sequence: 11110xxx 10xxxxxx 10xxxxxx 10xxxxxx
      if (i + 3 >= len) return { valid: false, hasMultiByte };
      const b1 = bytes[i + 1];
      const b2 = bytes[i + 2];
      const b3 = bytes[i + 3];
      if ((b1 & 0xC0) !== 0x80 || (b2 & 0xC0) !== 0x80 || (b3 & 0xC0) !== 0x80) return { valid: false, hasMultiByte };
      if (b0 === 0xF0 && b1 < 0x90) return { valid: false, hasMultiByte }; // overlong
      if (b0 === 0xF4 && b1 > 0x8F) return { valid: false, hasMultiByte }; // beyond Unicode
      hasMultiByte = true;
      i += 4;
    } else {
      return { valid: false, hasMultiByte };
    }
  }
  return { valid: true, hasMultiByte };
}

/**
 * Plausibility scoring for legacy single-byte and multi-byte code pages.
 */
interface ScriptPlausibility {
  encoding: string;
  score: number;
  reason: string;
}

function scoreDecodedText(encoding: string, text: string): ScriptPlausibility {
  if (text.includes('\uFFFD')) {
    return { encoding, score: -2000, reason: 'Contains replacement characters (\uFFFD)' };
  }

  let controlCount = 0;
  let puaCount = 0; // Private Use Area characters
  let asciiCount = 0;
  let nonAsciiCount = 0;
  let arabicCount = 0;
  let cyrillicCount = 0;
  let greekCount = 0;
  let hebrewCount = 0;
  let thaiCount = 0;
  let hangulCount = 0;
  let cjkCount = 0;
  let kanaCount = 0;
  let accentedLatinCount = 0;

  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    // Unprintable control codes (excluding \t, \n, \r)
    if ((code < 0x20 && code !== 0x09 && code !== 0x0A && code !== 0x0D) || (code >= 0x7F && code <= 0x9F)) {
      controlCount++;
      continue;
    }

    // PUA (Private Use Area - commonly produced when invalid bytes map to font-specific glyphs)
    if (code >= 0xE000 && code <= 0xF8FF) {
      puaCount++;
      continue;
    }

    if (code < 0x80) {
      asciiCount++;
      continue;
    }

    nonAsciiCount++;

    // Arabic
    if ((code >= 0x0600 && code <= 0x06FF) || (code >= 0x0750 && code <= 0x077F) || (code >= 0x08A0 && code <= 0x08FF)) {
      arabicCount++;
    }
    // Cyrillic
    else if (code >= 0x0400 && code <= 0x04FF) {
      cyrillicCount++;
    }
    // Greek
    else if (code >= 0x0370 && code <= 0x03FF) {
      greekCount++;
    }
    // Hebrew
    else if (code >= 0x0590 && code <= 0x05FF) {
      hebrewCount++;
    }
    // Thai
    else if (code >= 0x0E00 && code <= 0x0E7F) {
      thaiCount++;
    }
    // Hangul (Korean syllables & jamo)
    else if ((code >= 0xAC00 && code <= 0xD7AF) || (code >= 0x1100 && code <= 0x11FF)) {
      hangulCount++;
    }
    // Japanese Kana (Hiragana & Full-width Katakana only - half-width katakana excluded per instructions)
    else if ((code >= 0x3040 && code <= 0x309F) || (code >= 0x30A0 && code <= 0x30FF)) {
      kanaCount++;
    }
    // CJK Ideographs (Chinese/Japanese kanji)
    else if (code >= 0x4E00 && code <= 0x9FFF) {
      cjkCount++;
    }
    // Accented Latin (e.g. French, German, Spanish)
    else if ((code >= 0x00C0 && code <= 0x00FF) || (code >= 0x0100 && code <= 0x017F)) {
      accentedLatinCount++;
    }
  }

  let score = 0;
  if (controlCount > 0) score -= controlCount * 50;
  if (puaCount > 0) score -= puaCount * 100;

  const words = text.split(/[\s,;|"'\r\n]+/).filter((w) => w.length > 0);
  let nonLatinWords = 0;
  let mixedAccentLatinWords = 0;
  let caseAlternationPenalty = 0;

  for (const w of words) {
    let hasAsciiAlpha = false;
    let hasNonAscii = false;
    let hasAccentedLatin = false;

    // Check for abnormal case mixing (e.g. ΚδΡνΡ or КдСнС - uppercase followed by lowercase followed by uppercase)
    if (w.length >= 3) {
      for (let j = 0; j < w.length - 2; j++) {
        const c1 = w[j];
        const c2 = w[j + 1];
        const c3 = w[j + 2];
        const isUpper1 = c1 !== c1.toLowerCase() && c1 === c1.toUpperCase();
        const isLower2 = c2 === c2.toLowerCase() && c2 !== c2.toUpperCase();
        const isUpper3 = c3 !== c3.toLowerCase() && c3 === c3.toUpperCase();
        if (isUpper1 && isLower2 && isUpper3) {
          caseAlternationPenalty += 60;
        }
      }
    }

    for (let j = 0; j < w.length; j++) {
      const c = w.charCodeAt(j);
      if ((c >= 0x41 && c <= 0x5A) || (c >= 0x61 && c <= 0x7A)) {
        hasAsciiAlpha = true;
      } else if (c >= 0x80) {
        hasNonAscii = true;
        if ((c >= 0x00C0 && codePointIsLatin(c))) {
          hasAccentedLatin = true;
        }
      }
    }

    if (hasNonAscii && !hasAsciiAlpha) {
      nonLatinWords++;
    } else if (hasAsciiAlpha && hasAccentedLatin) {
      mixedAccentLatinWords++;
    }
  }

  score -= caseAlternationPenalty;

  // Check script consistency at word level:
  // Non-Latin scripts (Arabic, Cyrillic, Greek, Hebrew, Thai) must form whole non-Latin words.
  // Mixing ASCII letters with non-Latin letters in the same word (e.g. cafι) indicates wrong decoding.
  let scriptMixingPenalty = 0;
  for (const w of words) {
    let hasAsciiAlpha = false;
    let hasGreek = false;
    let hasCyrillic = false;
    let hasHebrew = false;
    let hasArabic = false;
    let hasThai = false;

    for (let j = 0; j < w.length; j++) {
      const c = w.charCodeAt(j);
      if ((c >= 0x41 && c <= 0x5A) || (c >= 0x61 && c <= 0x7A)) hasAsciiAlpha = true;
      if (c >= 0x0370 && c <= 0x03FF) hasGreek = true;
      if (c >= 0x0400 && c <= 0x04FF) hasCyrillic = true;
      if (c >= 0x0590 && c <= 0x05FF) hasHebrew = true;
      if (c >= 0x0600 && c <= 0x06FF) hasArabic = true;
      if (c >= 0x0E00 && c <= 0x0E7F) hasThai = true;
    }

    if (hasAsciiAlpha) {
      if ((encoding === 'windows-1253' && hasGreek) ||
          ((encoding === 'windows-1251' || encoding === 'koi8-r') && hasCyrillic) ||
          (encoding === 'windows-1255' && hasHebrew) ||
          ((encoding === 'windows-1256' || encoding === 'iso-8859-6') && hasArabic) ||
          (encoding === 'windows-874' && hasThai)) {
        scriptMixingPenalty += 80;
      }
    }
  }

  score -= scriptMixingPenalty;

  let reason = '';

  switch (encoding) {
    case 'windows-1256':
    case 'iso-8859-6': {
      if (arabicCount > 0) {
        score += arabicCount * 18 + nonLatinWords * 25;
        // Frequent Arabic letters: ا ل م ي و ن ر ب ت ه س د ع ف ق
        const freqArabic = (text.match(/[الميونربتهسدعفق]/g) || []).length;
        score += freqArabic * 25;
        reason = `Arabic script identified (${arabicCount} letters, ${freqArabic} common Arabic consonants/vowels)`;
      }
      break;
    }
    case 'windows-1251':
    case 'koi8-r': {
      if (cyrillicCount > 0) {
        score += cyrillicCount * 16 + nonLatinWords * 20;
        // Severe penalty if capital soft sign (Ь U+042C), hard sign (Ъ U+042A), or Ы (U+042B) appears in lowercase context
        if (/[а-яё][ЬЪЫ]|[ЬЪЫ][а-яё]/g.test(text)) {
          score -= 300;
        }
        // Frequent Cyrillic letters: о, е, а, и, н, т, с, р, в, л, к, м, п, д, я
        const freqCyrillic = (text.match(/[оеаинтсрвлкмпдяОЕАИНТСРВЛКМПДЯ]/g) || []).length;
        score += freqCyrillic * 18;
        if (/отчет|продаж|данны|сумм|месяц|клиент/i.test(text)) {
          score += 200;
        }
        reason = `Cyrillic script identified (${cyrillicCount} letters, ${freqCyrillic} common letters)`;
      }
      break;
    }
    case 'windows-1253': {
      if (greekCount > 0) {
        score += greekCount * 14 + nonLatinWords * 20;
        // Greek accented vowels (tonus: ά έ ή ί ό ύ ώ) are unique to Greek
        const tonusCount = (text.match(/[άέήίόύώΆΈΉΊΌΎΏ]/g) || []).length;
        if (tonusCount > 0) {
          score += tonusCount * 30;
        }
        const freqGreek = (text.match(/[αοειτνσρΑΟΕΙΤΝΣΡ]/g) || []).length;
        score += freqGreek * 20;
        if (/ελλάδα|αναφορά|δεδομένα|στοιχεία/i.test(text)) {
          score += 200;
        }
        reason = `Greek script identified (${greekCount} letters, ${tonusCount} accented vowels)`;
      }
      break;
    }
    case 'windows-1255': {
      if (hebrewCount > 0) {
        score += hebrewCount * 16 + nonLatinWords * 20;
        // In valid Hebrew, final letters (ך, ם, ן, ף, ץ) NEVER appear at word starts or before letters
        const invalidFinalLetters = (text.match(/(?:^|\s)[ךםןףץ]|[ךםןףץ][\u05D0-\u05EA]/g) || []).length;
        if (invalidFinalLetters > 0) {
          score -= invalidFinalLetters * 100;
        }
        const freqHebrew = (text.match(/[יוהלבמתרשאנעד]/g) || []).length;
        score += freqHebrew * 20;
        if (/שלום|עולם|דוח|נתונים|סך/i.test(text)) {
          score += 200;
        }
        reason = `Hebrew script identified (${hebrewCount} letters)`;
      }
      break;
    }
    case 'windows-874': {
      if (thaiCount > 0) {
        score += thaiCount * 16 + nonLatinWords * 20;
        const freqThai = (text.match(/[กานรงมดยเะา]/g) || []).length;
        score += freqThai * 18;
        reason = `Thai script identified (${thaiCount} characters)`;
      }
      break;
    }
    case 'shift_jis':
    case 'euc-jp': {
      if (kanaCount > 0 || cjkCount > 0) {
        score += kanaCount * 50 + cjkCount * 30;
        reason = `Japanese text identified (${kanaCount} Kana, ${cjkCount} CJK ideographs)`;
      }
      break;
    }
    case 'gbk':
    case 'gb18030': {
      if (cjkCount > 0 && kanaCount === 0 && hangulCount === 0) {
        score += cjkCount * 35 + nonLatinWords * 20;
        const freqSimplified = (text.match(/[的一是不了在人有我他这国销售数据报表]/g) || []).length;
        score += freqSimplified * 25;
        reason = `Simplified Chinese script identified (${cjkCount} CJK ideographs)`;
      }
      break;
    }
    case 'big5': {
      if (cjkCount > 0 && kanaCount === 0 && hangulCount === 0) {
        score += cjkCount * 35 + nonLatinWords * 20;
        const freqTraditional = (text.match(/[這爲為國說們於體點會]/g) || []).length;
        score += freqTraditional * 30;
        reason = `Traditional Chinese (Big5) script identified (${cjkCount} CJK ideographs)`;
      }
      break;
    }
    case 'euc-kr': {
      if (hangulCount > 0) {
        score += hangulCount * 70 + nonLatinWords * 30;
        reason = `Korean Hangul script identified (${hangulCount} syllables)`;
      }
      break;
    }
    case 'windows-1252': {
      if (accentedLatinCount > 0) {
        score += accentedLatinCount * 15 + mixedAccentLatinWords * 40;
        reason = `Western European accented text identified (${accentedLatinCount} accented characters, ${mixedAccentLatinWords} mixed words)`;
      } else {
        score += 1;
        reason = 'Standard Western European (Windows-1252) fallback';
      }
      break;
    }
  }

  return { encoding, score, reason: reason || `Plausibility score ${score}` };
}

function codePointIsLatin(c: number): boolean {
  return (c >= 0x00C0 && c <= 0x00FF) || (c >= 0x0100 && c <= 0x017F);
}

/**
 * Detects the encoding of a byte array using the strict order:
 * BOM -> UTF-16 without BOM -> Valid UTF-8 -> Legacy code pages -> Windows-1252
 */
export function detectEncoding(bytes: Uint8Array): DetectedEncoding {
  if (!bytes || bytes.length === 0) {
    return { encoding: 'utf-8', confidence: 1, reason: 'Empty file defaults to UTF-8' };
  }

  // 1. BOM check
  const bom = detectBOM(bytes);
  if (bom) {
    return { encoding: bom.encoding, confidence: 1.0, reason: bom.reason };
  }

  // 2. UTF-16 without BOM
  const utf16 = detectUTF16WithoutBOM(bytes);
  if (utf16) {
    return { encoding: utf16.encoding, confidence: 0.95, reason: utf16.reason };
  }

  // 3. Valid UTF-8 check
  const utf8Check = isValidUTF8(bytes);
  if (utf8Check.valid) {
    if (utf8Check.hasMultiByte) {
      return {
        encoding: 'utf-8',
        confidence: 0.98,
        reason: 'Valid multi-byte UTF-8 sequences detected with zero decoding errors',
      };
    }
    return {
      encoding: 'utf-8',
      confidence: 0.90,
      reason: 'Standard 7-bit ASCII byte sequence (UTF-8 compatible)',
    };
  }

  // 4. Legacy code pages scored by script & language plausibility
  const candidates = [
    'windows-1256',
    'iso-8859-6',
    'windows-1251',
    'koi8-r',
    'windows-1253',
    'windows-1255',
    'windows-874',
    'shift_jis',
    'euc-jp',
    'gbk',
    'gb18030',
    'big5',
    'euc-kr',
    'windows-1252',
  ];

  let bestCandidate: ScriptPlausibility = {
    encoding: 'windows-1252',
    score: -9999,
    reason: 'Fallback to Windows-1252',
  };

  for (const cand of candidates) {
    try {
      const decoder = new TextDecoder(cand, { fatal: false });
      const decoded = decoder.decode(bytes);
      const res = scoreDecodedText(cand, decoded);
      if (res.score > bestCandidate.score) {
        bestCandidate = res;
      }
    } catch {
      // Decoder not available or failed
    }
  }

  if (bestCandidate.score > 5) {
    return {
      encoding: bestCandidate.encoding,
      confidence: Math.min(0.95, 0.5 + bestCandidate.score / 200),
      reason: bestCandidate.reason,
    };
  }

  // 5. Fallback to Windows-1252
  return {
    encoding: 'windows-1252',
    confidence: 0.5,
    reason: 'Legacy single-byte text defaulted to Windows-1252 (Western European)',
  };
}

/**
 * Decodes a byte buffer into text using the specified encoding (or auto-detected).
 * Also strips BOM and flags presence of replacement characters (\uFFFD).
 */
export function decodeBytes(bytes: Uint8Array, requestedEncoding: string = 'auto'): DecodedResult {
  let targetEncoding = requestedEncoding.toLowerCase();
  let reason = '';

  if (targetEncoding === 'auto' || !targetEncoding) {
    const detected = detectEncoding(bytes);
    targetEncoding = detected.encoding;
    reason = detected.reason;
  } else {
    reason = `User override: ${targetEncoding}`;
  }

  // Check and strip BOM if applicable
  let slice = bytes;
  const bom = detectBOM(bytes);
  if (bom && (targetEncoding === bom.encoding || targetEncoding.startsWith('utf'))) {
    slice = bytes.subarray(bom.bomLength);
  }

  try {
    const decoder = new TextDecoder(targetEncoding, { fatal: false });
    const text = decoder.decode(slice);
    const hasReplacementChar = text.includes('\uFFFD');
    return {
      text,
      encoding: targetEncoding,
      hasReplacementChar,
      reason,
    };
  } catch {
    // If specific decoder failed, fall back to utf-8 then windows-1252
    try {
      const fallback = new TextDecoder('windows-1252').decode(slice);
      return {
        text: fallback,
        encoding: 'windows-1252',
        hasReplacementChar: fallback.includes('\uFFFD'),
        reason: `Decoder failed for ${targetEncoding}; fell back to Windows-1252`,
      };
    } catch {
      const utfFallback = new TextDecoder('utf-8').decode(slice);
      return {
        text: utfFallback,
        encoding: 'utf-8',
        hasReplacementChar: utfFallback.includes('\uFFFD'),
        reason: 'Emergency fallback to UTF-8',
      };
    }
  }
}
