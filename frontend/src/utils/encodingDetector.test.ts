import { describe, expect, it } from 'vitest';
import { detectEncoding, decodeBytes, detectBOM, detectUTF16WithoutBOM, isValidUTF8 } from './encodingDetector';

describe('encodingDetector', () => {
  it('detects UTF-8 BOM', () => {
    // EF BB BF followed by "id,name\n1,Alpha"
    const bytes = new Uint8Array([0xEF, 0xBB, 0xBF, 0x69, 0x64, 0x2C, 0x6E, 0x61, 0x6D, 0x65]);
    const bom = detectBOM(bytes);
    expect(bom).not.toBeNull();
    expect(bom?.encoding).toBe('utf-8');

    const detected = detectEncoding(bytes);
    expect(detected.encoding).toBe('utf-8');

    const decoded = decodeBytes(bytes, 'auto');
    expect(decoded.text).toBe('id,name');
    expect(decoded.hasReplacementChar).toBe(false);
  });

  it('detects UTF-16 LE with BOM', () => {
    // FF FE followed by 'A' (0x41 0x00), 'B' (0x42 0x00)
    const bytes = new Uint8Array([0xFF, 0xFE, 0x41, 0x00, 0x42, 0x00, 0x0A, 0x00]);
    const detected = detectEncoding(bytes);
    expect(detected.encoding).toBe('utf-16le');

    const decoded = decodeBytes(bytes, 'auto');
    expect(decoded.text.trim()).toBe('AB');
    expect(decoded.hasReplacementChar).toBe(false);
  });

  it('detects UTF-16 BE with BOM', () => {
    // FE FF followed by 'A' (0x00 0x41), 'B' (0x00 0x42)
    const bytes = new Uint8Array([0xFE, 0xFF, 0x00, 0x41, 0x00, 0x42, 0x00, 0x0A]);
    const detected = detectEncoding(bytes);
    expect(detected.encoding).toBe('utf-16be');

    const decoded = decodeBytes(bytes, 'auto');
    expect(decoded.text.trim()).toBe('AB');
  });

  it('detects UTF-16 LE without BOM from alternating zero bytes', () => {
    // "id,name,value\n1,test,100\n2,demo,200\n" in UTF-16LE
    const text = 'id,name,value\n1,test,100\n2,demo,200\n';
    const bytes = new Uint8Array(text.length * 2);
    for (let i = 0; i < text.length; i++) {
      bytes[i * 2] = text.charCodeAt(i);
      bytes[i * 2 + 1] = 0x00;
    }

    const utf16 = detectUTF16WithoutBOM(bytes);
    expect(utf16).not.toBeNull();
    expect(utf16?.encoding).toBe('utf-16le');

    const detected = detectEncoding(bytes);
    expect(detected.encoding).toBe('utf-16le');

    const decoded = decodeBytes(bytes, 'auto');
    expect(decoded.text).toContain('id,name,value');
  });

  it('detects standard multi-byte UTF-8', () => {
    // "تقرير مالي" in UTF-8:
    // ت=D8 AA, ق=D8 B1, ر=D8 B1, ي=D9 8A, ر=D8 B1, ' '=20, م=D9 85, ا=D8 A7, ل=D9 84, ي=D9 8A
    const bytes = new Uint8Array([
      0xD8, 0xAA, 0xD9, 0x82, 0xD8, 0xB1, 0xD9, 0x8A, 0xD8, 0xB1,
      0x20,
      0xD9, 0x85, 0xD8, 0xA7, 0xD9, 0x84, 0xD9, 0x8A,
    ]);
    const utf8 = isValidUTF8(bytes);
    expect(utf8.valid).toBe(true);
    expect(utf8.hasMultiByte).toBe(true);

    const detected = detectEncoding(bytes);
    expect(detected.encoding).toBe('utf-8');

    const decoded = decodeBytes(bytes, 'auto');
    expect(decoded.text).toBe('تقرير مالي');
  });

  it('detects Windows-1256 (Arabic legacy code page)', () => {
    // "تقرير مالي" in Windows-1256:
    // ت = 0xCA, ق = 0xDE, ر = 0xD1, ي = 0xED, ر = 0xD1, ' ' = 0x20, م = 0xE3, ا = 0xC7, ل = 0xE1, ي = 0xED
    const bytes = new Uint8Array([0xCA, 0xDE, 0xD1, 0xED, 0xD1, 0x20, 0xE3, 0xC7, 0xE1, 0xED]);
    // Not valid UTF-8
    expect(isValidUTF8(bytes).valid).toBe(false);

    const detected = detectEncoding(bytes);
    expect(detected.encoding).toBe('windows-1256');

    const decoded = decodeBytes(bytes, 'auto');
    expect(decoded.text).toBe('تقرير مالي');
    expect(decoded.hasReplacementChar).toBe(false);
  });

  it('detects Windows-1251 (Cyrillic legacy code page)', () => {
    // "Отчет по продажам" in Windows-1251:
    // О=CE, т=F2, ч=F7, е=E5, т=F2, ' '=20, п=EF, о=EE, ' '=20, п=EF, р=F0, о=EE, д=E4, а=E0, ж=E6, а=E0, м=EC
    const bytes = new Uint8Array([
      0xCE, 0xF2, 0xF7, 0xE5, 0xF2, 0x20, 0xEF, 0xEE, 0x20, 0xEF, 0xF0, 0xEE, 0xE4, 0xE0, 0xE6, 0xE0, 0xEC,
    ]);
    expect(isValidUTF8(bytes).valid).toBe(false);

    const detected = detectEncoding(bytes);
    expect(detected.encoding).toBe('windows-1251');

    const decoded = decodeBytes(bytes, 'auto');
    expect(decoded.text).toBe('Отчет по продажам');
  });

  it('detects Windows-1253 (Greek)', () => {
    // "Ελλάδα αναφορά" in Windows-1253:
    // Ε=C5, λ=EB, λ=EB, ά=DC, δ=E4, α=E1, ' '=20, α=E1, ν=ED, α=E1, φ=F6, ο=EF, ρ=F1, ά=DC
    const bytes = new Uint8Array([
      0xC5, 0xEB, 0xEB, 0xDC, 0xE4, 0xE1, 0x20, 0xE1, 0xED, 0xE1, 0xF6, 0xEF, 0xF1, 0xDC,
    ]);
    expect(isValidUTF8(bytes).valid).toBe(false);

    const detected = detectEncoding(bytes);
    expect(detected.encoding).toBe('windows-1253');

    const decoded = decodeBytes(bytes, 'auto');
    expect(decoded.text).toBe('Ελλάδα αναφορά');
  });

  it('detects Windows-1255 (Hebrew)', () => {
    // "שלום עולם דוח" in Windows-1255:
    // ש=F9, ל=EC, ו=E5, ם=ED, ' '=20, ע=F2, ו=E5, ל=EC, ם=ED, ' '=20, ד=E3, ו=E5, ח=E7
    const bytes = new Uint8Array([
      0xF9, 0xEC, 0xE5, 0xED, 0x20, 0xF2, 0xE5, 0xEC, 0xED, 0x20, 0xE3, 0xE5, 0xE7,
    ]);
    expect(isValidUTF8(bytes).valid).toBe(false);

    const detected = detectEncoding(bytes);
    expect(detected.encoding).toBe('windows-1255');

    const decoded = decodeBytes(bytes, 'auto');
    expect(decoded.text).toBe('שלום עולם דוח');
  });

  it('detects Windows-874 (Thai)', () => {
    // "รายงานข้อมูล" in Windows-874:
    // ร=C3, า=D2, ย=C2, ง=A7, า=D2, น=B9
    const bytes = new Uint8Array([0xC3, 0xD2, 0xC2, 0xA7, 0xD2, 0xB9]);
    expect(isValidUTF8(bytes).valid).toBe(false);

    const detected = detectEncoding(bytes);
    expect(detected.encoding).toBe('windows-874');

    const decoded = decodeBytes(bytes, 'auto');
    expect(decoded.text).toBe('รายงาน');
  });

  it('detects Shift_JIS (Japanese)', () => {
    // "売上データ" in Shift_JIS:
    // 売 = 0x94 0x84, 上 = 0x8F 0xE3, デ = 0x83 0x66, ー = 0x81 0x5B, タ = 0x83 0x5E
    const bytes = new Uint8Array([0x94, 0x84, 0x8F, 0xE3, 0x83, 0x66, 0x81, 0x5B, 0x83, 0x5E]);
    expect(isValidUTF8(bytes).valid).toBe(false);

    const detected = detectEncoding(bytes);
    expect(detected.encoding).toBe('shift_jis');

    const decoded = decodeBytes(bytes, 'auto');
    expect(decoded.text).toBe('売上データ');
  });

  it('detects GBK (Simplified Chinese)', () => {
    // "销售数据报表" in GBK:
    // 销=CF FA, 售=CA DB, 数=CA FD, 据=BE DD, 报=B1 A8, 表=B1 ED
    const bytes = new Uint8Array([
      0xCF, 0xFA, 0xCA, 0xDB, 0xCA, 0xFD, 0xBE, 0xDD, 0xB1, 0xA8, 0xB1, 0xED,
    ]);
    expect(isValidUTF8(bytes).valid).toBe(false);

    const detected = detectEncoding(bytes);
    expect(detected.encoding).toBe('gbk');

    const decoded = decodeBytes(bytes, 'auto');
    expect(decoded.text).toBe('销售数据报表');
  });

  it('detects Big5 (Traditional Chinese)', () => {
    // "這是一個傳統國家的測試" in Big5:
    // 這=B3 6F, 國=B0 EA, 們=AD CC
    const bytes = new Uint8Array([0xB3, 0x6F, 0xB0, 0xEA, 0xAD, 0xCC]);
    expect(isValidUTF8(bytes).valid).toBe(false);

    const detected = detectEncoding(bytes);
    expect(['big5', 'gb18030', 'gbk']).toContain(detected.encoding);

    const decoded = decodeBytes(bytes, 'big5');
    expect(decoded.text).toBe('這國們');
  });

  it('detects EUC-KR (Korean)', () => {
    // "한국어" in EUC-KR:
    // 한 = C7 D1, 국 = B1 B9, 어 = BE EE
    const bytes = new Uint8Array([0xC7, 0xD1, 0xB1, 0xB9, 0xBE, 0xEE]);
    expect(isValidUTF8(bytes).valid).toBe(false);

    const detected = detectEncoding(bytes);
    expect(detected.encoding).toBe('euc-kr');

    const decoded = decodeBytes(bytes, 'auto');
    expect(decoded.text).toBe('한국어');
  });

  it('detects Windows-1252 for accented Latin European text', () => {
    // "café, résumé, año, Über" in Windows-1252:
    // é = 0xE9, ñ = 0xF1, Ü = 0xDC
    const bytes = new Uint8Array([
      0x63, 0x61, 0x66, 0xE9, 0x2C, 0x20, // café,
      0x61, 0xF1, 0x6F, 0x2C, 0x20,       // año,
      0xDC, 0x62, 0x65, 0x72              // Über
    ]);
    expect(isValidUTF8(bytes).valid).toBe(false);

    const detected = detectEncoding(bytes);
    expect(detected.encoding).toBe('windows-1252');

    const decoded = decodeBytes(bytes, 'auto');
    expect(decoded.text).toBe('café, año, Über');
    expect(decoded.hasReplacementChar).toBe(false);
  });
});
