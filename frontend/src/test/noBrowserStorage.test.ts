import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

/**
 * Permanent guard for the "everything lives in the database" rule: application code must not touch any
 * browser persistence API. (Sessions are an httpOnly cookie set by the API, which scripts cannot read.)
 */
const FORBIDDEN = [
  /\blocalStorage\b/, /\bsessionStorage\b/, /\bindexedDB\b/, /\bopenDatabase\b/, /document\.cookie/,
  /\bcaches\.(open|match|keys)\b/, /navigator\.serviceWorker/, /navigator\.storage/, /\bcookieStore\b/,
  /\bshowSaveFilePicker\b/, /\bwindow\.name\s*=/,
];

function* files(dir: string): Generator<string> {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* files(p);
    else if (/\.(ts|tsx)$/.test(e.name) && !/\.test\.tsx?$/.test(e.name)) yield p;
  }
}

const stripComments = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

describe('no browser storage in the frontend', () => {
  const root = path.resolve(__dirname, '..');
  it('source files never use a persistence API', () => {
    const offenders: string[] = [];
    for (const f of files(root)) {
      const code = stripComments(fs.readFileSync(f, 'utf8'));
      for (const re of FORBIDDEN) if (re.test(code)) offenders.push(`${path.relative(root, f)}: ${re}`);
    }
    expect(offenders).toEqual([]);
  });

  it('index.html registers no service worker or manifest', () => {
    const html = fs.readFileSync(path.resolve(root, '..', 'index.html'), 'utf8');
    expect(html).not.toMatch(/serviceWorker|rel=["']manifest["']/);
  });
});
