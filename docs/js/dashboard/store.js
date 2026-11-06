import { TABLES, emptyBook, mutate, cleanRecord, validateBook } from './model.js';
const LOCAL_KEY = 'piso-wais-local-preview-v1';
export function localStore(storage, initial = emptyBook()) {
  let book = structuredClone(initial);
  const existing = storage?.getItem(LOCAL_KEY);
  if (existing) {
    try { book = validateBook(JSON.parse(existing)); }
    catch { throw Error('The saved local preview cannot be read. Clear this site’s local preview data in your browser settings to restart.'); }
  }
  return {
    async load() { return structuredClone(book); },
    async save(table, data, id) { const next = mutate(book, table, data, id); storage?.setItem(LOCAL_KEY, JSON.stringify(next)); book = next; return this.load(); },
    async remove(table, id) { const next = mutate(book, table, null, id, true); storage?.setItem(LOCAL_KEY, JSON.stringify(next)); book = next; return this.load(); },
    async clear() { storage?.removeItem(LOCAL_KEY); book = emptyBook(); return this.load(); }
  };
}
// Filter by owner in addition to server RLS. The server is the security boundary.
export function supabaseStore(client, userId) {
  if (!userId) throw Error('Sign in before opening your records.');
  const tableName = table => { if (!TABLES.includes(table)) throw Error('Unknown table.'); return `pw_${table}`; };
  let active = true;
  const check = () => { if (!active) throw Error('This session has ended. Sign in again.'); };
  return {
    dispose() { active = false; },
    async load() {
      check();
      const rows = await Promise.all(TABLES.map(async table => {
        const all = [];
        // Never silently stop at PostgREST's default 1,000-row response cap.
        for (let start = 0; ; start += 500) {
          check();
          const { data, error } = await client.from(tableName(table)).select('*').eq('owner_id', userId).order('id').range(start, start + 499);
          if (error) throw Error('Could not load your records. Check your connection or dashboard setup.');
          if (data.some(row => row.owner_id !== userId)) throw Error('Data ownership check failed.');
          all.push(...data);
          if (data.length < 500) return [table, all];
        }
      }));
      check(); return validateBook(Object.fromEntries(rows));
    },
    async save(table, input, id) {
      check();
      const payload = { ...cleanRecord(table, input), owner_id: userId };
      const q = id ? client.from(tableName(table)).update(payload).eq('id', id).eq('owner_id', userId) : client.from(tableName(table)).insert(payload);
      const { data, error } = await q.select('id');
      if (error) throw Error(error.code === '23505' && table === 'goals' ? 'The free account includes one goal.' : 'Not saved. Check amounts and linked entries, refresh, and try again.');
      if (data.length !== 1) throw Error('Record changed or is unavailable. Refresh before retrying.');
      check();
      try { return await this.load(); } catch { throw Error('Saved, but the refreshed totals could not load. Refresh before entering it again.'); }
    },
    async remove(table, id) {
      check();
      const { data, error } = await client.from(tableName(table)).delete().eq('id', id).eq('owner_id', userId).select('id');
      if (error || data.length !== 1) throw Error('Not deleted. Remove linked entries first, or refresh and try again.');
      check();
      try { return await this.load(); } catch { throw Error('Deleted, but the refreshed totals could not load. Refresh your dashboard.'); }
    }
  };
}
export function accountConfig(config) {
  if (config?.accountsEnabled !== true) return false;
  try { return new URL(config.supabaseUrl).protocol === 'https:' && /^sb_publishable_[\w-]+$/.test(config.publishableKey || ''); } catch { return false; }
}
