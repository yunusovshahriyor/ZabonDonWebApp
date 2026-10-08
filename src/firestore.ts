// Хонандаи сабуки Cloud Firestore тавассути REST (бе SDK, бе калид).
// Лоиҳаи Firebase: ҳамон ки барномаи Android ва AdminPanel истифода мебаранд (ruslearn-503f9).
// Хондан бе воридшавӣ кор мекунад, зеро қоидаҳои Firestore барои мӯҳтавои омӯзишӣ хондани оммавӣ медиҳанд.

export const FIREBASE_PROJECT_ID = 'ruslearn-503f9';
const BASE = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

type FsValue = {
  stringValue?: string;
  integerValue?: string;
  doubleValue?: number;
  booleanValue?: boolean;
  nullValue?: null;
};
type FsDoc = { name: string; fields?: Record<string, FsValue> };

export type Doc = { id: string; fields: Record<string, FsValue> };

/** Ҳамаи ҳуҷҷатҳои коллексия (бо саҳифабандӣ); `fields` — маскаи майдонҳо барои сабук кардани ҷавоб. */
export async function listDocuments(collection: string, fields: string[], signal?: AbortSignal): Promise<Doc[]> {
  const out: Doc[] = [];
  let pageToken = '';
  do {
    const params = new URLSearchParams({ pageSize: '500' });
    for (const f of fields) params.append('mask.fieldPaths', f);
    if (pageToken) params.set('pageToken', pageToken);
    const res = await fetch(`${BASE}/${collection}?${params.toString()}`, { signal });
    if (!res.ok) throw new Error(`Firestore ${collection}: HTTP ${res.status}`);
    const json = (await res.json()) as { documents?: FsDoc[]; nextPageToken?: string };
    for (const d of json.documents ?? []) {
      out.push({ id: d.name.split('/').pop() ?? '', fields: d.fields ?? {} });
    }
    pageToken = json.nextPageToken ?? '';
  } while (pageToken);
  return out;
}

/** Аввалин майдони ғайрихолии сатрӣ аз рӯйхати калидҳо (мисли LearningContentFields.str дар Android). */
export function str(doc: Doc, ...keys: string[]): string {
  for (const k of keys) {
    const v = doc.fields[k]?.stringValue?.trim();
    if (v) return v;
  }
  return '';
}

export function num(doc: Doc, ...keys: string[]): number {
  for (const k of keys) {
    const v = doc.fields[k];
    if (!v) continue;
    if (v.integerValue !== undefined) return Number(v.integerValue);
    if (v.doubleValue !== undefined) return v.doubleValue;
  }
  return 0;
}

export function bool(doc: Doc, keys: string[], fallback: boolean): boolean {
  for (const k of keys) {
    const v = doc.fields[k]?.booleanValue;
    if (v !== undefined) return v;
  }
  return fallback;
}
