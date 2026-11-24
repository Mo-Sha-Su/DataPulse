import { describe, expect, it } from 'vitest';
import { isUuid, resolveDbId, uuidV5 } from '../lib/ids';
import { hashPassword, verifyPassword } from '../lib/password';

describe('ids', () => {
  it('uuidV5 matches the RFC 4122 reference vector', () => {
    expect(uuidV5('www.example.com', '6ba7b810-9dad-11d1-80b4-00c04fd430c8')).toBe('2ed6657d-e927-568b-95e1-2665a8aea6a2');
  });
  it('maps non-uuid ids deterministically per workspace and leaves uuids alone', () => {
    const ws1 = '11111111-1111-4111-8111-111111111111';
    const ws2 = '22222222-2222-4222-8222-222222222222';
    expect(resolveDbId(ws1, 'ds_1')).toEqual(resolveDbId(ws1, 'ds_1'));
    expect(resolveDbId(ws1, 'ds_1').dbId).not.toBe(resolveDbId(ws2, 'ds_1').dbId);
    expect(isUuid(resolveDbId(ws1, 'ds_1').dbId)).toBe(true);
    const u = '33333333-3333-4333-8333-333333333333';
    expect(resolveDbId(ws1, u)).toEqual({ dbId: u, clientId: null });
  });
});

describe('password', () => {
  it('hashes, verifies, and salts', async () => {
    const h1 = await hashPassword('s3cret-pass');
    const h2 = await hashPassword('s3cret-pass');
    expect(h1).not.toBe(h2);
    expect((await verifyPassword('s3cret-pass', h1)).ok).toBe(true);
    expect((await verifyPassword('nope', h1)).ok).toBe(false);
  });
  it('rejects empty, malformed and unsupported hashes', async () => {
    for (const bad of [null, undefined, '', 'plain', '$argon2id$x', '$pbkdf2$abc$salt$zz', '$pbkdf2$100000$salt$']) {
      expect((await verifyPassword('anything', bad as any)).ok).toBe(false);
    }
  });
});

describe('toJson & orderRowKeys data integrity', () => {
  it('preserves Arabic, CJK, and emoji without corruption', async () => {
    const { toJson } = await import('../lib/json');
    const data = {
      arabic: 'تقرير مالي معتمد 2026',
      chinese: '销售数据与产品报表',
      emoji: '📊 🚀 ✨ 📈 💡',
    };
    const jsonStr = toJson(data);
    const parsed = JSON.parse(jsonStr);
    expect(parsed.arabic).toBe(data.arabic);
    expect(parsed.chinese).toBe(data.chinese);
    expect(parsed.emoji).toBe(data.emoji);
  });

  it('strips NUL bytes (\\u0000) so PostgreSQL jsonb does not reject the insert', async () => {
    const { toJson } = await import('../lib/json');
    const dataWithNul = { name: 'Data\u0000Pulse\x00Clean', text: 'Hello\u0000World' };
    const jsonStr = toJson(dataWithNul);
    expect(jsonStr).not.toContain('\\u0000');
    const parsed = JSON.parse(jsonStr);
    expect(parsed.name).toBe('DataPulseClean');
    expect(parsed.text).toBe('HelloWorld');
  });

  it('orderRowKeys restores column order exactly from dataset columns configuration', async () => {
    const { orderRowKeys } = await import('../lib/rows');
    const columns = [{ name: 'Order ID' }, { name: 'Customer' }, { name: 'Region' }, { name: 'Sales' }];
    // Arbitrary key insertion order
    const rawRows = [
      { Sales: 250, Region: 'North', 'Order ID': 'ORD-101', Customer: 'Acme' },
      { Customer: 'Beta', Sales: 500, 'Order ID': 'ORD-102', Region: 'South' },
    ];
    const ordered = orderRowKeys(rawRows, columns);
    expect(Object.keys(ordered[0])).toEqual(['Order ID', 'Customer', 'Region', 'Sales']);
    expect(Object.keys(ordered[1])).toEqual(['Order ID', 'Customer', 'Region', 'Sales']);
  });
});

