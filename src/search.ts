import { getAllWords, getCategories, type Category, type Word } from './content';

// ё = е, регистр ба назар гирифта намешавад.
const norm = (s: string) => s.toLowerCase().replace(/ё/g, 'е').trim();

export type SearchResult = { categories: Category[]; words: Word[] };

/** Ҷустуҷӯ дар категорияҳо (номи тоҷикӣ/русӣ) ва калимаҳо (русӣ/тоҷикӣ); калимаҳое, ки бо матн оғоз мешаванд, пештаранд. */
export function searchContent(query: string, maxWords = 40): SearchResult {
  const q = norm(query);
  if (!q) return { categories: [], words: [] };
  const categories = getCategories().filter((c) => norm(c.titleTg).includes(q) || norm(c.titleRu).includes(q));
  const rank = (w: Word) => (norm(w.ru).startsWith(q) || norm(w.tj).startsWith(q) ? 0 : 1);
  const words = getAllWords()
    .filter((w) => norm(w.ru).includes(q) || norm(w.tj).includes(q))
    .sort((a, b) => rank(a) - rank(b))
    .slice(0, maxWords);
  return { categories, words };
}
