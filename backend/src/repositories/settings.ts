import { query } from '../db';
import { toJson } from '../lib/json';

export async function getSettings(userId: string): Promise<{ preferences: any; theme: string }> {
  const rows = await query(`SELECT preferences, theme FROM user_settings WHERE user_id = $1::uuid`, [userId]);
  return rows[0]
    ? { preferences: rows[0].preferences || {}, theme: rows[0].theme || 'light' }
    : { preferences: {}, theme: 'light' };
}

export async function saveSettings(userId: string, s: { preferences?: unknown; theme?: string }) {
  const rows = await query(
    `INSERT INTO user_settings (user_id, preferences, theme) VALUES ($1::uuid, $2::jsonb, $3)
     ON CONFLICT (user_id) DO UPDATE SET
       preferences = COALESCE(user_settings.preferences, '{}'::jsonb) || EXCLUDED.preferences,
       theme = COALESCE(EXCLUDED.theme, user_settings.theme),
       updated_at = now()
     RETURNING preferences, theme`,
    [userId, toJson(s.preferences ?? {}), s.theme ?? 'light']
  );
  return { preferences: rows[0].preferences || {}, theme: rows[0].theme };
}
